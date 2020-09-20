import {Box, IconButton, Link} from '@chakra-ui/core';
import React from 'react';
import NextLink from 'next/link'
import {useDeletePostMutation, useMeQuery} from '../generated/graphql';

interface EditDeletePostButtonsProps {
  id: number;
  originalPosterId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  originalPosterId,
}) => {
  const [{data: meData}] = useMeQuery()
  const [,deletePost] = useDeletePostMutation();
 if(meData?.me?.id !== originalPosterId){
   return null
 }
  return (
    <Box>
      <NextLink href='/post/edit/[id]' as={`/post/edit/${id}`}>
        <IconButton 
         as={Link}
         mr={4}
         icon='edit' 
         aria-label="Edit Post" 
         />
      </NextLink>
      <IconButton
       icon='delete' 
       aria-label="Delete Post" 
       onClick={() => {
         deletePost({
           id 
         })
       }}/>
    </Box>
  )
};
