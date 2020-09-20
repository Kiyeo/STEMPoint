import React  from 'react'
import {Form, Formik} from 'formik'
import {Box, Button } from '@chakra-ui/core'
import {InputField} from '../components/inputField'
import {withUrqlClient} from 'next-urql'
import {createUrqlClient} from '../utils/createUrqlClient'
import {useCreatePostMutation } from '../generated/graphql'
import {useRouter} from 'next/router'
import {Layout} from '../components/Layout'
import {useIsAuth} from '../utils/useIsAuth'

const CreatePost: React.FC<{}> = ({}) =>{
  const router = useRouter();
  useIsAuth()
  const [,createPost] = useCreatePostMutation();
  return(
      <Layout variant='small'>
          <Formik initialValues={{title: '', text: ''}}
         onSubmit={async (values ) => {
           const {error} = await createPost({input: values})
           if(!error){
           router.push("/")
           }
          }}
      >
        {({isSubmitting}) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title"/>
            <Box mt={4}>
            <InputField textarea name="text" placeholder="text..." label="Body" />
            </Box>
            <Button mt={4} type="submit" isLoading={isSubmitting} variantColor="teal">Create Post</Button>
          </Form>
        )}
      </Formik>
      </Layout>
  )
}

export default withUrqlClient(createUrqlClient)(CreatePost)
