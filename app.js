// opening the installed libaries.
const express 		= require('express')
const bodyParser 	= require('body-parser')
const pg 			= require('pg')
const sequelize 	= require('sequelize')
const session 		= require('express-session')
const bcrypt 		= require('bcrypt');
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

let Comment = db.define ('comments', {
	comment: sequelize.STRING
})



// define relations
User.hasMany( Blog )
Blog.belongsTo ( User )

User.hasMany ( Comment )
Blog.hasMany ( Comment )

Comment.belongsTo( User )
Comment.belongsTo( Blog )



// Setting up the App.Get so that the pages can be renderd. 
app.get ('/', (req, res) => {
	console.log ('Index page loaded')
	res.render('index' , {
		message: req.query.message,
		user: req.session.user
	})
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
	// In the database we are looking for one-User which has the email that matches the email that was put in.
	User.findOne({
		where: {
			email: request.body.email
		}
	}).then(function (user) {
		if (user !== null) {
			bcrypt.compare(request.body.password, user.password, function(err, res) {
    			if (res == true) {
    				request.session.user = user;
					response.redirect('personalblog');
				}
				// bcrypt is hashing the password and making sure it is saved secure in my database.
				// the compare must between the whole bracket to make sure the password can be compared.
				// this cant be done with only bcrypt compare the password.
			})
			// console.log ('Whoop Whoop') 
			// test if a user is created
		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
			// if the users is not null (not undifined) and the password is the same as password
			//then it will be logged in else it will be redirected to index and told invalid password or email.
		}
	}, function (error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		// When everything goed wrong between server and database, the user will be told his email or password is invalid
		// This will be told instead of telling the telling the user something terrible went wrong 
	}) 
})


//// Make logout work (sends user to a new page, then redirects it to  home page again)
app.get('/logout', function (request, response) {
	request.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})

});

// Making the link to the sign-up page.
app.get ('/sign-up', (req, res) => {
	console.log ('Sign-up page loaded')
	res.render('sign-up', {
		message: req.query.message,
		user: req.session.user
	})
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
			},
			include: [ User ]
		} ).then (blogs => {
			console.log (request.session.user)
			response.render('personalblog', {
				user: user, blog: blogs
			});
		})

	}
})

// CREATING A NEW USER IN THE DATABASE. 
app.post('/sign', bodyParser.urlencoded({extended: true}) , function (request, response) {
	if (request.body.name.length === 0) {
			response.send('sign-up/?message=' + encodeURIComponent("Please fill out your name."))
			return
	}
	if(request.body.email.length === 0) {
		response.send('sign-up/?message=' + encodeURIComponent("Please fill out your email address."))
		return
	}

	if(request.body.password.length === 0) {
		response.send('sign-up/?message=' + encodeURIComponent("Please fill out your password."))
		return
	}
	// console.log (request.body.password )
		bcrypt.hash(request.body.password , 5, function(err, hash) {
	    	User.create( {
	            name: request.body.name,
	            email: request.body.email,
	            password: hash		
	        }).then ( register => {
        	// console.log (request.body.password )
        	response.redirect('/?message=' + encodeURIComponent('You are Now Officially a BlogsAlotter!'))
        })
	})
})


// CREATING A NEW BLOG
app.post('/post', bodyParser.urlencoded({extended: true}) , function (request, response) {
	// Simple backend check if both fields are filled in correctly.
	if (request.body.blog.length === 0) {
			response.send('sign-up/?message=' + encodeURIComponent("Please give your blog a title."))
			return
	}
	if(request.body.blogtext.length === 0) {
		response.send('sign-up/?message=' + encodeURIComponent("It would be nice if you typed something."))
		return
	}

	// console.log (request.body.blog )
		Blog.create( {
            title: request.body.blog,
            body: request.body.blogtext,
            userId: request.session.user.id 
        }).then ( register => {
        	// console.log (request.body.password )
        	response.redirect('/blogs?message=' + encodeURIComponent('Thank you for creating a blog, BlogsAlotter'))
        })
})

// Seeing a single post
app.get('/viewsinglepost', function (req, res) {
	var message = req.query.message;
	var user = req.session.user;
	var blogid = req.query.id;
	console.log("CHECK THIS AWESOME POSTID: " + blogid)
	if (user === undefined) {
		res.redirect('/?message=' + encodeURIComponent("Please log in to view this post."));
	} else {
		console.log('\nThe browser will now display one post.')
		Blog.findAll({
			where: {id: blogid},
			include: [
				{
					model: User
				},
				{
					model: Comment,
					include: [User]
				}
			]
			//en include posts (dat zou er maar een moeten zijn)
			// 	where: {userId: user.id}
		}).then(function(comments) {
			res.render('viewsinglepost', {data: comments, currentUser: user, message: message})
			console.log(comments)
		});
	}
});

//// Make certain post page work: use ID of a post
app.post('/viewsinglepost', function (req, res) {
	var blogid = req.query.id;
	console.log(blogid)
	Comment.create( {
		comment: req.body.comment,
		userId: req.session.user.id,
		blogId: blogid
		// postId: MOET NOG GEKOPPELD WORDEN NAV MEESTUREN VAN EEN ID
	})
	res.redirect('viewsinglepost?id=' + req.query.id)
})


// Creating users for the database
db.sync ( {force: true} ).then( () => {
	console.log ( 'Synced')
	bcrypt.hash('1234', 5, function(err, hash) {
		User.create ({
			name: 'Jimmy',
			email: 'jimmyvoskuil@msn.com',
			password: hash
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
	})
	bcrypt.hash('1234', 5, function(err, hash) {	
		User.create ({
			name: 'Mentor',
			email: 'mentor@gmail.com',
			password: hash

		}).then (user => {
			user.createBlog( {
				title: 'Lo0ok',
				body: 'I can type'
			})
		})
	})
}) 

//This will make sure when we run nodemon that the app can be opened on localhost:8000
app.listen (8000, () => {
	console.log('Sever running')
})













