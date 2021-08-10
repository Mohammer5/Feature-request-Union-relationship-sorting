const fs = require("fs");
const path = require('path')
const { Neo4jGraphQL } = require('@neo4j/graphql')
const { ApolloServer } = require('apollo-server-express')
const dotenv = require('dotenv')
const express = require('express')
const { json } = require('express')
const neo4j = require('neo4j-driver')

dotenv.config()
const withUnion = process.argv.includes('--with-union')

const auth = neo4j.auth.basic('name', 'password')
const driver = neo4j.driver('bolt://valid.url', auth, { encrypted: false })

const pathToSchema = path.join(
  __dirname,
  withUnion
    ? 'schema.with-union.graphql'
    : 'schema.without-union.graphql'
)
const typeDefs = fs.readFileSync(pathToSchema, { encoding: 'utf8' })

const neoSchema = new Neo4jGraphQL({ typeDefs, driver })
const server = new ApolloServer({
  schema: neoSchema.schema,
  introspection: true,
  playground: true,
  context: ({ req }) => ({ req }),
})

const PORT = process.env.GRAPHQL_LISTEN_PORT || 4001
const PATH = "/graphql"
const app = express()

app.use(json({ limit: '500mb' }))
server.applyMiddleware({ app, path: PATH })

const readyMsg = `GraphQL server ready at http://localhost:${PORT}${PATH}`
app.listen({ port: PORT, path: PATH }, () => console.log(readyMsg))
