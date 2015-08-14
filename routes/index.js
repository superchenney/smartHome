var express = require('express');
var router = express.Router();
var app = express();
var bodyParser = require('body-parser');







var kaideng     = new Buffer('26535253000000000000000000004A000000000000000000000000000000002A','hex');//开继电器1（开灯）
var guandeng    = new Buffer('26535253000000000000000000004A000100000000000000000000000000002A','hex');//关继电器1（关灯）

var kaichuang   = new Buffer('265352530000000000000000000042000100000000000000000000000000002A','hex');//步进电机顺时针转（开窗）
var guanchuang  = new Buffer('265352530000000000000000000042010000000000000000000000000000002A','hex');//步进电机逆时针转（关窗）

var kaideng2    = new Buffer('26535253000000000000000000004A010000000000000000000000000000002A','hex');//开继电器2
var guandeng2   = new Buffer('26535253000000000000000000004A010100000000000000000000000000002A','hex');//关继电器2

var shenghuo    = new Buffer('26535253000000000000000000005A000000000000000000000000000000002A','hex');//回家模式（开继电器1,2 步进顺）
var anfang      = new Buffer('26535253000000000000000000005A010100000000000000000000000000002A','hex');//离家模式(关继电器1,2，步进逆)



function saveInfo(req,housename,operate){
  var Operate = global.dbHandel.getModel('operate');
      Operate.create({
          housename: housename,
          username:  req.session.user.name,
          operate: operate,
          date: Date.now()
        });
        console.log('\n' + '*****  数据已保存  ******');
	}	//svaeInofo


function saveWSInfo(wendu,shidu){
  var Wenshidu = global.dbHandel.getModel('wenshidu');
      Wenshidu.create({
          date: Date.now(),
          temperature: wendu,
          humidity:shidu
        });
        console.log('\n' + '*****  温湿度数据采集保存  ******');
}





//socket 客户端（连接远程服务器）
var net = require('net');
var clientPro = new net.Socket();       //区分websoket，改名为clientPro

clientPro.connect(8080,'192.168.11.254', function() {
    console.log('Remote Socket clientPro Connetcted To : ' + "192.168.11.254" + ':' +" 8080");
});

// 为客户端添加“data”事件处理函数
// data是服务器发回的数据
clientPro.on('data', function(data) {
  var recivedata = data.toString();
      console.log('收到数据: ' + recivedata);

    if(recivedata[0]=='W'){

      var wendu = recivedata.substring(6,9);
      var shidu = recivedata.substring(12,15);
      saveWSInfo(wendu,shidu);
      console.log('温度数据为: ' + wendu);
      console.log('湿度数据为: ' + shidu);
    }
    // 完全关闭连接
    // clientPro.destroy();
});

// 为客户端添加“close”事件处理函数
clientPro.on('close', function() {
    console.log('Connection closed');
});

//错误回调
clientPro.on('error', function (exception) {
    console.log('socket error:' + exception);
    clientPro.end();
});















/* GET index page. */
router.get('/', function(req, res,next) {
  res.render('index', { title: '首页' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});



/* GET login page. */
router.route("/login").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
	res.render("login",{title:'用户登录'});
}).post(function(req,res){ 					   // 从此路径检测到post方式则进行post数据的处理操作
	//get User info
	 //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
	var User = global.dbHandel.getModel('user');
	var uname = req.body.uname;				//获取post上来的 data数据中 uname的值
	User.findOne({name:uname},function(err,doc){   //通过此model以用户名的条件 查询数据库中的匹配信息
		if(err){ 										//错误就返回给原post处（login.html) 状态码为500的错误
			res.send(500);
			console.log(err);
		}else if(!doc){ 								//查询不到用户名匹配信息，则用户名不存在
			req.session.error = '用户名不存在';
			res.send(404);							//	状态码返回404
		//	res.redirect("/login");
		}else{
			if(req.body.upwd != doc.password){ 	//查询到匹配用户名的信息，但相应的password属性不匹配
				req.session.error = "密码错误";
				res.send(404);
			//	res.redirect("/login");
			}else{ 									//信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
				req.session.user = doc;
				res.send(200);
			//	res.redirect("/home");
			}
		}
	});
});



/* GET register page. */
router.route("/register").get(function(req,res){    // 到达此路径则渲染register文件，并传出title值供 register.html使用
	res.render("register",{title:'用户注册'});
}).post(function(req,res){
	 //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
	var User = global.dbHandel.getModel('user');
	var uname = req.body.uname;															//chenney
	var upwd = req.body.upwd;
	User.findOne({name: uname},function(err,doc){   // 同理 /login 路径的处理方式
		if(err){
			res.send(500);
			req.session.error =  '网络异常错误！';
			console.log(err);
		}else if(doc){
			req.session.error = '用户名已存在！';
			res.send(500);
		}else{
			User.create({ 							// 创建一组user对象置入model
				name: uname,
				password: upwd
			},function(err,doc){
				 if (err) {
              res.send(500);
              console.log(err);
           } else {
              req.session.error = '用户名创建成功！';
              res.send(200);
           }
      });
		}
	});
});



router.get("/home",function(req,res){
	if(!req.session.user){ 					//到达/home路径首先判断是否已经登录
		req.session.error = "请先登录"
		res.redirect("/login");				//未登录则重定向到 /login 路径
	   }
    res.render("home",{title:'控制台页面',username:req.session.user.name});
});	//get/home







  router.route('/anfang').post(function(req,res){
  	 	clientPro.write(anfang);
      saveInfo(req,'系统','安防模式');
      console.log('\n' + '*****  ' + req.session.user.name + '安防   ******' + '\n');
      res.status(200).send("安防ok");	//AJAX请求返回成功
  });
  router.route('/shenghuo').post(function(req,res){
  	 	clientPro.write(shenghuo);
      saveInfo(req,'系统','生活');
      console.log('\n' + '*****  ' + req.session.user.name + '生活  ******' + '\n');
      res.status(200).send("生活ok");	//AJAX请求返回成功
  });
  router.route('/xiuxi').post(function(req,res){
  	 	clientPro.write(shenghuo);
      saveInfo(req,'系统','休息');
      console.log('\n' + '*****  ' + req.session.user.name + '休息   ******' + '\n');
      res.status(200).send("休息ok");	//AJAX请求返回成功
  });









router.route('/kaichuang').post(function(req,res){
	 	clientPro.write(kaichuang);
    saveInfo(req,'卧室','开窗');
    console.log('\n' + '*****  ' + req.session.user.name + '开窗   ******' + '\n');
    res.status(200).send("开窗ok");	//AJAX请求返回成功
});


router.route('/guanchuang').post(function(req,res){

	  clientPro.write(guanchuang);
    saveInfo(req,'卧室','关窗');
 		console.log('\n' + '*****  ' + req.session.user.name + '关窗   ******' + '\n');
 		res.status(200).send('关窗ok');	//AJAX请求返回成功
});


router.route('/kaideng').post(function(req,res){

		clientPro.write(kaideng);
    saveInfo(req,'客厅','开灯');
 	  console.log('\n' + '*****  ' + req.session.user.name + '开灯   ******' + '\n');
 	  res.status(200).send('开灯ok');	//AJAX请求返回成功
});


router.route('/guandeng').post(function(req,res){

		clientPro.write(guandeng);
	  saveInfo(req,'客厅','关灯');
 		console.log('\n' + '*****  ' + req.session.user.name + '关灯   ******' + '\n');
 		res.status(200).send('关灯ok');	//AJAX请求返回成功
});


router.get('/wenshidu', function(req, res) {
  res.render('wenshidu', { title: "温湿度" });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});


router.get('/guangzhao', function(req, res) {
  res.render('guangzhao', { title: '光照' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});




  // 记录页面
router.get('/record', function(req, res,next) {
  var Operate = global.dbHandel.getModel('operate');
    	Operate.find({}).sort('-date').exec(function(err,doc){
    						if(err){
    							console.log(err);
    						}else{
    							// console.log('记录 item : ' + doc);
    							res.render("record",{title:'操作记录',item:doc});
                };	//else
    					});	//Operate
    });     //按时间排序，最近操作排在第一




//设置页面
router.get('/setting', function(req, res,next) {
  res.render('setting', { title: '设置' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});



/* GET logout page. */
router.get("/logout",function(req,res){    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
	req.session.user = null;
	req.session.error = null;
	res.redirect("/");
});


module.exports = router;
