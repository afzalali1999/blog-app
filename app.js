var express          = require("express"),
    app              = express(),
    bodyParser       = require("body-parser"),
    mongoose         = require("mongoose"),
    methodOverride   = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    keys             = require("./keys");

mongoose.connect(
    `mongodb+srv://${keys.mongodbUsername}:${keys.mongodbPassword}@cluster0.tvoxc.mongodb.net/${keys.dbName}?retryWrites=true&w=majority`, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        useFindAndModify: false 
    }
);

mongoose.connection.on('connected', () => {
    console.log('connected to MongoDB')
});

mongoose.connection.on('error', (error) => {
    console.log('Error in connecting to MongoDB:', error)
});

//APP CONFIG
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(methodOverride("_method")); //tell app to use methodOverride, and then pass the argument on what it should look for in the url which is _method

//MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});

var Blog = mongoose.model("Blog", blogSchema); //defines model and makes Blog collection

//RESTful ROUTES

//INDEX route
app.get("/", function(req, res) {
    res.redirect("/blogs");
});

app.get("/blogs", function(req, res){
    Blog.find({}, function(err, blogs){ //this line of code is to retrieve all of the blogs from the db //blogs is the name for the data that comes back from .find() // {} means all of the data
        if(err){
            console.log("ERROR!")
        } else {
            res.render("index", {blogs: blogs}); //render index with data from .find, which is blogs
        }
    });
});

//NEW route
app.get("/blogs/new", function(req, res) {
    res.render("new");
});

//CREATE route
app.post("/blogs", function(req, res){
    //create blog
    req.body.blog.body = req.sanitize(req.body.blog.body); //req.body is the data coming back from the form //blog.body is the blog[body] name that was given to the input //sanitizes body from any malicious js
    
    Blog.create(req.body.blog, function(err, newBlog){ //req.body.blog is the data from the form. It takes that data and creates a new blog. When done, it callsback
        if(err){
            res.render("new");
        } else {
            //then, refirect to the index
            res.redirect("/blogs");
        }
    });
});

//SHOW route
app.get("/blogs/:id", function(req, res) {
    //take the id, find the corresponding blog, and then render the show template //Find the correct blog inside that show route
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else {
            res.render("show", {blog:foundBlog});
        }
    });
});

// EDIT route
app.get("/blogs/:id/edit", function(req, res) {
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else {
            res.render("edit", {blog: foundBlog}); //pass data foundBlog into blog
        }
    });
});

//UPDATE route
app.put("/blogs/:id", function(req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    //Take the id in the url, find the existing blog/post, and update it with the new data
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){ //Takes 3 arguments findByIdAndUpdate(id, newData, callback)
        if(err){
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

//DESTROY route
app.delete("/blogs/:id", function(req, res){
    //destroy blog
    Blog.findByIdAndRemove(req.params.id, function(err){ //Our callback just takes error because there is no data that will want to do anything with coming back, if we delete something then it's gone
        if(err){
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    });
    //redirect somewhere
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function(){
    console.log('server is running on port', PORT);
});