const BodyParser = require("body-parser")
const multer = require('multer')
const cloudinary = require('cloudinary')
const { GraphQLServer, PubSub } = require("graphql-yoga")
const mongoose = require("mongoose")
const url = require('url')
const path = require('path')
const express = require('express')
const schema = require("./graphql/schema/index")
const resolvers = require("./graphql/resolvers/index")
const upload = require("./middleware/multer")
const Question = require("./models/question")
const cors = require('cors')

const typeDefs = schema

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context(request) {
    return {
      request,
      pubsub
    }
  }
})
//adnan:adnan1540@ds129625.mlab.com:29625/online-exam-center
//mongodb://adnan:adnan1540@ds129625.mlab.com:29625/online-exam-center
// mongodb://localhost:27017/oem
mongoose
  .connect(
    "mongodb://adnan:adnan1540@ds129625.mlab.com:29625/online-exam-center",
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

cloudinary.config({
  cloud_name: "bookcycle",
  api_key: "899686255551365",
  api_secret: "e_c1gq9QHSO3IknVfQXJaYsZ1ok"
})

server.express.use(cors())
server.express.use(BodyParser.json({ limit: '50mb' }))
server.express.use(BodyParser.urlencoded({ extended: true }))

server.express.post('/api/upload', function (req, res) {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err)
    } else if (err) {
      return res.status(500).json(err)
    }
    const newImage = req.file.path
    cloudinary.v2.uploader.upload(
      newImage,
      {
        width: 200,
        height: 200,
        crop: "fit"
      },
      async (err, result) => {
        let q = url.parse(req.url, true).query
        const imgUrl = result.url
        const e_id = q.e_id
        const q_id = q.q_id
        const q_no = Number(q.q_no)
        try {
          const question = await Question.findOne({ _id: q_id })
          if (question["questions"].length < q_no + 1) {
            return res.json({ "error": "You must submit the question data first" })
          }
          question["questions"][q_no]["image"] = imgUrl
          await question.save()
          return res.json({ "question": question })
        } catch (err) {
          console.log(err)
        }
      })
  })
})

const opts = {
  port: process.env.PORT || 8000,
  endpoint: '/',
  playground: false
}

const wwwPath = path.join(__dirname, 'www')
server.express.use(express.static(wwwPath))

server.start(opts, ({ port }) => {
  console.log("Server is running on port " + port)
})