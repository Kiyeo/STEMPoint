import {Entity,PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column, BaseEntity, ManyToOne, OneToMany } from 'typeorm'
import {Field, Int, ObjectType} from "type-graphql";
import {User} from './User';
import {Upvote} from './Upvote';

@ObjectType()
@Entity()
export class Post extends BaseEntity{

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;
  
  @Field()
  @Column({type: "int", default: 0})
  points!: number;

  @Field(() => Int, {nullable: true})
  voteStatus: number | null

  @Field()
  @Column()
  originalPosterId: number;

  @Field()
  @ManyToOne(()=> User, user => user.posts)
  originalPoster: User;
  
  @OneToMany(() => Upvote, (upvote) => upvote.post)
  upvotes: Upvote[];
}
