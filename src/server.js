const BodyParser = require("body-parser")
const multer = require('multer')
const cloudinary = require('cloudinary')
const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginDrainHttpServer } = require('apollo-server-core')
const { PubSub } = require('graphql-subscriptions')
const mongoose = require("mongoose")
const url = require('url')
const path = require('path')
const express = require('express')
const cors = require('cors')
const http = require('http')


const schema = require("./graphql/schema/index")
const resolvers = require("./graphql/resolvers/index")
const upload = require("./middleware/multer")
const Question = require("./models/question")


const typeDefs = schema

const pubsub = new PubSub()


async function startApolloServer(typeDefs, resolvers) {
  // Required logic for integrating with Express
  const app = express();
  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    cache: 'bounded',
    context: ({ req }) => ({
      request: req,
      pubsub: pubsub,
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  // More required logic for integrating with Express
  await server.start();
  server.applyMiddleware({
    app,

    // By default, apollo-server hosts its GraphQL endpoint at the
    // server root. However, *other* Apollo Server packages host it at
    // /graphql. Optionally provide this to match apollo-server.
    path: '/',
  });

  // Modified server startup
  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}




mongoose
  .connect(
    "mongodb://localhost:27017/oem",
    {
      useNewUrlParser: true,
      useCreateIndex: true
    }
  )
  .then(() => {
    console.log("Successfully connected to Mongodb")
  })
  .catch(err => {
    console.log(err.message)
  })

  startApolloServer(typeDefs, resolvers)
