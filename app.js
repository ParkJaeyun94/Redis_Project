var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


const redis = require("redis");
// redis 기본 port = 6379
const REDIS_PORT = 6379;
const redisClient = redis.createClient(REDIS_PORT);
const axios = require("axios").default;

const redisSet = (key, value) =>{
  redisClient.set(key, JSON.stringify(value))
}

// express의 미들웨어
const redisGet = (req, res, next) => {
  // redis에 id값으로 확인해봐
  const { id } = req.params;
  redisClient.get(id, (err, data)=>{
    if (err) res.send(err);
    // 있으면 redis data 바로 보내줘. redis에 있으면 바로 보냄. redis에 없으면 next()를 통해 그 뒤에 app.get이 쓰인다.
    data !== null ? res.send(JSON.parse(data)) : next();
  });
}

app.get("/redis/:id",redisGet, async (req, res) =>{
  // 미들웨어가 먼저 실행 : redisGet
  const { id } = req.params;
  const { data } = await axios.request({
    methods: "get",
    url: `http://reqres.in/api/product/${id}`
  });
  redisSet(id, data);
  res.send(data);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
