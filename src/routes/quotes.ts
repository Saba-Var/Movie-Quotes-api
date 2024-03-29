import { validateRequestSchema } from 'middlewares'
import { uploadQuoteImage } from 'utils'
import express from 'express'
import {
  getCertainMovieQuotes,
  getNewsFeedPost,
  commentOnQuote,
  dislikeQuote,
  deleteQuote,
  changeQuote,
  getAllQuote,
  likeQuote,
  addQuote,
} from 'controllers'
import {
  changeQuoteSchema,
  newCommentSchema,
  quoteSchema,
  idSchema,
} from 'schemas'

const router = express.Router()

router.delete('/delete-quote', idSchema, validateRequestSchema, deleteQuote)

router.get('/movie-quotes', getCertainMovieQuotes)

router.get('/all-quotes', getAllQuote)

router.get('/news-feed-post', getNewsFeedPost)

router.put('/like-quote', likeQuote)

router.put('/dislike-quote', dislikeQuote)

router.put(
  '/change-quote',
  uploadQuoteImage,
  idSchema,
  changeQuoteSchema,
  validateRequestSchema,
  changeQuote
)

router.post(
  '/add-quote',
  uploadQuoteImage,
  quoteSchema,
  validateRequestSchema,
  addQuote
)

router.post(
  '/add-comment',
  newCommentSchema,
  validateRequestSchema,
  commentOnQuote
)

export default router
