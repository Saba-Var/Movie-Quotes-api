import { Server, Socket } from 'socket.io'

const EVENTS = {
  connection: 'connection',

  movies: {
    on: {
      DELETE_MOVIE_QUOTE: 'DELETE_MOVIE_QUOTE',
      UPDATE_MOVIE: 'UPDATE_MOVIE',
      EDIT_QUOTE: 'EDIT_QUOTE',
      ADD_QUOTE: 'ADD_QUOTE',
      ADD_MOVIE: 'ADD_MOVIE',
    },

    emit: {
      SEND_NEW_MOVIE_QUOTES: 'SEND_NEW_MOVIE_QUOTES',
      SEND_UPDATED_MOVIE: 'SEND_UPDATED_MOVIE',
      SEND_EDITED_QUOTE: 'SEND_EDITED_QUOTE',
      SEND_NEW_QUOTE: 'SEND_NEW_QUOTE',
      SEND_NEW_MOVIE: 'SEND_NEW_MOVIE',
    },
  },
}

const socket = ({ io }: { io: Server }) => {
  io.on(EVENTS.connection, (socket: Socket) => {
    socket.on(EVENTS.movies.on.ADD_MOVIE, (newMovie) => {
      socket.emit(EVENTS.movies.emit.SEND_NEW_MOVIE, newMovie)
    })

    socket.on(EVENTS.movies.on.UPDATE_MOVIE, (updatedMovie) => {
      socket.emit(EVENTS.movies.emit.SEND_UPDATED_MOVIE, updatedMovie)
    })

    socket.on(EVENTS.movies.on.DELETE_MOVIE_QUOTE, (deletedQuoteId) => {
      socket.emit(EVENTS.movies.emit.SEND_NEW_MOVIE_QUOTES, deletedQuoteId)
    })

    socket.on(EVENTS.movies.on.ADD_QUOTE, (quote) => {
      socket.emit(EVENTS.movies.emit.SEND_NEW_QUOTE, quote)
    })

    socket.on(EVENTS.movies.on.EDIT_QUOTE, (editedQuote) => {
      socket.emit(EVENTS.movies.emit.SEND_EDITED_QUOTE, editedQuote)
    })
  })
}

export default socket
