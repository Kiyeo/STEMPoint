
import {User} from "../entities/User";
import {MyContext} from "../types";
import {Arg, Ctx, Field, FieldResolver, Mutation, ObjectType, Query, Resolver, Root} from "type-graphql";
import argon2 from 'argon2';
import {COOKIE_NAME, FORGET_PASSWORD_PREFIX} from "../constants";
import {validateRegister} from "../utils/validateRegister";
import {UsernamePasswordInput} from "./UsernamePasswordInput";
import {sendEmail} from "../utils/sendEmail";
import {v4} from 'uuid'
import {getConnection} from "typeorm"


@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];

  @Field(() => User, {nullable: true})
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() {req}: MyContext){
    // this is the current user and its ok to show them their own email
    if(req.session.userId === user.id){
      return user.email
    }
    // current user wants to see someone elses email
    return "";
  }

  @Mutation(()=> UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() {redis, req}: MyContext
  ): Promise<UserResponse> {
  if (newPassword.length <= 2) {
    return { errors: [
      {
        field: "newPassword",
        message: "Password must be greater than 2 characters"
      },
    ]
    };
  }

  const key = FORGET_PASSWORD_PREFIX + token
  const userId = await redis.get(key);
  if(!userId){
    return{
      errors: [
        {
          field: "token",
          message: "Token expired"
      },
      ]   
    }
      
    };
  
    const userIdNum = parseInt(userId)
    const user = await User.findOne(userIdNum)

    if(!user){
    return{
      errors: [
        {
          field: "token",
          message: "User no longer exists"
      },
      ]   
    }
    }

    await User.update(
      {id: userIdNum}, 
      {password: await argon2.hash(newPassword)}
    )

    // delete token after use
    await redis.del(key);

    // log in user after change password
    req.session.userId = user.id;


    return {user};
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() {redis}: MyContext
  ) {
    const user = await User.findOne({where: {email}})
    if(!user){
      // The email is not in the db
      return true; // Security
    }
    const token = v4(); // creating unique tokens

    await redis.set(
      FORGET_PASSWORD_PREFIX + token, 
      user.id, 
      'ex', 
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      email, 
    `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
                    );
    return true
  }

  @Query(() => User, {nullable: true})
  me(
    @Ctx() {req}: MyContext
  ) {
    // you are not logged in
    if (!req.session.userId) {
      return null
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,//, () => UsernamePasswordInput)
    @Ctx() { req}: MyContext
  ): Promise<UserResponse> {
    console.log('test')
    const errors = validateRegister(options);
    if (errors) {
      return {errors};
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
          //User.create({}).save(); // the same as the code below
          const result = await getConnection()
          .createQueryBuilder()
          .insert()
          .into(User)
          .values(
            {
              username: options.username,
              email: options.email,
              password: hashedPassword
            }
          ).returning('*')
          .execute();
          console.log("result: ", result);
          user = result.raw[0];
    } catch (err) {
      console.log('err: ', err)
      // error code for duplicate username
      if (err.code === '23505') {// || err.detail.includes("already exists")) {
        return {
          errors: [{
            field: "username",
            message: "username already taken",
          },
          ],
        };
      }
      console.log("message: ", err.message);
    }

    // store user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session.userId = user.id;

    return {user};
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() {req}: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@') 
        ? {where: {email: usernameOrEmail}} 
        : {where: {username: usernameOrEmail}}
    ); // checks if usernameOrEmail has @ then assigns it to email otherwise username
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: "That username or email doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: "Incorrect password",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }
  @Mutation(() => Boolean)
  logout(@Ctx() {req, res}: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy(err => {
        if (err) {
          console.log(err);
          resolve(false)
          return
        }
        res.clearCookie(COOKIE_NAME) //clears Cookie when session is destroyed
        resolve(true)
      })
    );
  }
}
