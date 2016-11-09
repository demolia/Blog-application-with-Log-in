// opening the installed libaries.
const express 		= require('express')
const bodyParser 	= require('body-parser')
const pg 			= require('pg')
const sequelize 	= require('sequelize')
const app 			= express()

// setting the views engine to the folder views and telling it we use pug
app.set('view engine', 'pug');
app.set( 'views', __dirname + '/views' )

// telling the engine that all static files can be found in the virtual folder resources
app.use( '/resources', express.static( __dirname + '/static' ) )

// activating the body parser library 
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.json())

// test is front end and backend are working together
app.get ('/ping', (req, res) => {
	res.send('pong')
})


// defining the database 
let db = new sequelize ('user', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
	server: 'localhost',
	dialect: 'postgres'
} )

app.get ('/', (req, res) => {
	console.log ('Index page loaded')
	res.render('index')
})

app.get ('/sign-up', (req, res) => {
	console.log ('Sign-up page loaded')
	res.render('sign-up')
})

app.get ('/blogs', (req, res) => {
	console.log ('Blogs page loaded')
	res.render('blogs')
})

app.get ('/personalblog', (req, res) => {
	console.log ('Personal blog page loaded')
	res.render('personalblog')
})



















//This will make sure when we run nodemon that the app can be opened on localhost:8000
app.listen (8000, () => {
	console.log('Sever running')
})













