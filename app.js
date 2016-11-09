// opening the installed libaries.
const express 		= require('express')
const bodyParser 	= require('body-parser')
const pg 			= require('pg')
const sequelize 	= require('sequelize')
const session 		= require('express-session');
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

// setting up sessions in the database
app.use(session({
	secret: 'Error 418 I am a teapot',
	resave: true,
	saveUninitialized: false
}));

// defining the database 
let db = new sequelize ('users', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
	server: 'localhost',
	dialect: 'postgres'
} )

// define models
let User = db.define( 'user', {
	name: sequelize.STRING,
	email: { type: sequelize.STRING, unique: true},
	password: sequelize.STRING
} )

let Blog = db.define ( 'blog', {
	title: sequelize.STRING,
	body: sequelize.STRING,
} )

// define relations
User.hasMany( Blog )
Blog.belongsTo ( User )

// Setting up the App.Get so that the pages can be renderd. 
app.get ('/', (req, res) => {
	console.log ('Index page loaded')
	res.render('index')
})

// creating a log-in function
app.post('/login', bodyParser.urlencoded({extended: true}), function (request, response) {
	if(request.body.email.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(request.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: request.body.email
		}
	}).then(function (user) {
		if (user !== null && request.body.password === user.password) {
			request.session.user = user;
			response.redirect('personalblog');
			console.log ('Whoop Whoop')
		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function (error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
});

app.get ('/sign-up', (req, res) => {
	console.log ('Sign-up page loaded')
	res.render('sign-up')
})

app.get ('/blogs', (req, res) => {
	console.log ('Blogs page loaded')
	Blog.findAll ( {
		include: [ User ]
	} ).then (blogs => {
		res.render('blogs', {blog: blogs})
	})
})

app.get('/personalblog', function (request, response) {
	var user = request.session.user
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
	} else {
		Blog.findAll ( {
			where: {
				userId: request.session.user.id
			}
		} ).then (blogs => {
			console.log (request.session.user)
			response.render('personalblog', {
				user: user, blog: blogs
			});
		})

	}
})


app.post('/sign', bodyParser.urlencoded({extended: true}), function (request, response) {
	if (request.body.name.length === 0) {
			response.redirect('/?message=' + encodeURIComponent("Please fill out your name."));
			return;
	}
	if(request.body.email.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(request.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}
		Person.create({
            name: request.body.name,
            email: request.body.email,
            password: request.body.password 
        }).then ( register => {
        	response.send('You are Now Officially a BlogsAlotter!')
        })
})

// Creating users for the database
db.sync ( {force: true} ).then( () => {
	console.log ( 'Synced')
	User.create ({
		name: 'Jimmy',
		email: 'jimmyvoskuil@msn.com',
		password: '1234'
	}).then (user => {
		user.createBlog( {
			title: 'My first blog',
			body: 'to much to type'
		})
		user.createBlog( {
			title: 'My second blog',
			body: 'to much to type in here'
		})
	})
	User.create ({
		name: 'Mentor',
		email: 'mentor@gmail.com',
		password: '1234'
	}).then (user => {
		user.createBlog( {
			title: 'Lo0ok',
			body: 'I can type'
		})
	})
}) 





// app.get ('/hats', (req, res) => {
// 	Hat.findAll ( {
// 		include: [{
// 			model: User,
// 			attributes: [ 'name']
// 		}]
// 	} ).then (hats => {
// 		res.send (hats)
// 	})
// })

// app.get('/users', (req, res) => {
// 	User.findAll ( {
// 		attributes: [ 'name' ],
// 		include: [ Hat ]
// 	}).then (users => {
// 		res.send (users)
// 	})
// } )











//This will make sure when we run nodemon that the app can be opened on localhost:8000
app.listen (8000, () => {
	console.log('Sever running')
})













