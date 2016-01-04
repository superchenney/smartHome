var express = require('express');
var router = express.Router();
var app = express();
var bodyParser = require('body-parser');





var opercommand = new Object();
opercommand.kaideng = new Buffer('26535253000000000000000000004A000000000000000000000000000000002A', 'hex'); //开继电器1（开灯）
opercommand.guandeng = new Buffer('26535253000000000000000000004A000100000000000000000000000000002A', 'hex'); //关继电器1（关灯）
opercommand.kaichuang = new Buffer('265352530000000000000000000042000100000000000000000000000000002A', 'hex'); //步进电机顺时针转（开窗）
opercommand.guanchuang = new Buffer('265352530000000000000000000042010000000000000000000000000000002A', 'hex'); //步进电机逆时针转（关窗）
opercommand.kaideng2 = new Buffer('26535253000000000000000000004A010000000000000000000000000000002A', 'hex'); //开继电器2
opercommand.guandeng2 = new Buffer('26535253000000000000000000004A010100000000000000000000000000002A', 'hex'); //关继电器2
opercommand.shenghuo = new Buffer('26535253000000000000000000005A000000000000000000000000000000002A', 'hex'); //回家模式（开继电器1,2 步进顺）
opercommand.anfang = new Buffer('26535253000000000000000000005A010100000000000000000000000000002A', 'hex'); //离家模式(关继电器1,2，步进逆)


var dbContrl = new Object();
dbContrl.saveInfo = function(req, housename, operate) {
    var Operate = global.dbHandel.getModel('operate');
    Operate.create({
        housename: housename,
        username: req.session.user.name,
        operate: operate,
        date: Date.now()
    });
    console.log('\n' + '*****  数据已保存  ******');
};
dbContrl.saveWSInfo = function(wendu, shidu) {
    var Wenshidu = global.dbHandel.getModel('wenshidu');
    Wenshidu.create({
        date: Date.now(),
        temperature: wendu,
        humidity: shidu
    });
    var dates = new Date();
    console.log('\n' + '*****  ' + dates.toLocaleTimeString() + '温湿度数据采集保存  ******' + '\n');

};
dbContrl.saveGZInfo = function() {
    var GuangZhao = global.dbHandel.getModel('guangzhao');
    GuangZhao.create({
        date: Date.now(),
        illumination: guangzhao
    });
    var dates = new Date();
    console.log('\n' + '*****  ' + dates.toLocaleTimeString() + '光照数据采集保存  ******' + '\n');
};






//socket 客户端（连接远程服务器）
var net = require('net');
var clientPro = new net.Socket(); //区分websoket，改名为clientPro

clientPro.connect(8080, '192.168.11.254', function() {
    console.log('Remote Socket clientPro Connetcted To : ' + "192.168.11.254" + ':' + " 8080");
});

// 为客户端添加“data”事件处理函数
clientPro.on('data', function(data) {
    var recivedata = data.toString();
    console.log('收到数据: ' + recivedata);

    if (recivedata[0] == 'W') {
        var wendu = recivedata.substring(6, 8);
        var shidu = recivedata.substring(12, 14);
        saveWSInfo(wendu, shidu);
        console.log('温度数据为: ' + wendu);
        console.log('湿度数据为: ' + shidu);
    }
});

clientPro.on('close', function() {
    console.log('Socket Connection closed');
});


clientPro.on('error', function(exception) {
    console.log('Socket error:' + exception);
    clientPro.end();
});



router.get('/', function(req, res, next) {
    res.render('index', {
        title: '首页'
    });
});



/* GET login page. */
router.route("/login").get(function(req, res) {
    res.render("login");
}).post(function(req, res) {
    var User = global.dbHandel.getModel('user');
    var uname = req.body.uname;
    User.findOne({
        name: uname
    }, function(err, doc) {
        if (err) {
            res.send(500);
            console.log(err);
        } else if (!doc) { //查询不到用户名匹配信息，则用户名不存在
            req.session.error = '用户名不存在';
            res.send(404); // 状态码返回404
            //  res.redirect("/login");
        } else {
            if (req.body.upwd != doc.password) {
                req.session.error = "密码错误";
                res.send(404);
                //  res.redirect("/login");
            } else {
                req.session.user = doc;
                res.sendStatus(200);
                // res.redirect("/home");
            }
        }
    });
});



/* GET register page. */
router.route("/register").get(function(req, res) {
    res.render("register", {
        title: '用户注册'
    });
}).post(function(req, res) {
    var User = global.dbHandel.getModel('user');
    var uname = req.body.uname;
    var upwd = req.body.upwd;
    User.findOne({
        name: uname
    }, function(err, doc) {
        if (err) {
            res.send(500);
            req.session.error = '网络异常错误！';
            console.log(err);
        } else if (doc) {
            req.session.error = '用户名已存在！';
            res.send(500);
        } else {
            User.create({ // 创建一组user对象置入model
                name: uname,
                password: upwd
            }, function(err, doc) {
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



router.get("/home", function(req, res) {
    if (!req.session.user) { //到达/home路径首先判断是否已经登录
        req.session.error = "请先登录"
        res.redirect("/login"); //未登录则重定向到 /login 路径
    }
    res.render("home", {
        title: '控制台页面',
        username: req.session.user.name
    });
}); //get/home







router.route('/anfang').post(function(req, res) {
    clientPro.write(opercommand.anfang);
    dbContrl.saveInfo(req, '系统', '安防模式');
    console.log('\n' + '*****  ' + req.session.user.name + '安防   ******' + '\n');
    res.status(200).send("安防ok"); //AJAX请求返回成功
});
router.route('/shenghuo').post(function(req, res) {
    clientPro.write(opercommand.shenghuo);
    dbContrl.saveInfo(req, '系统', '生活模式');
    console.log('\n' + '*****  ' + req.session.user.name + '生活  ******' + '\n');
    res.status(200).send("生活ok"); //AJAX请求返回成功
});
router.route('/xiuxi').post(function(req, res) {
    clientPro.write(opercommand.shenghuo);
    dbContrl.saveInfo(req, '系统', '休息模式');
    console.log('\n' + '*****  ' + req.session.user.name + '休息   ******' + '\n');
    res.status(200).send("休息ok"); //AJAX请求返回成功
});









router.route('/kaichuang').post(function(req, res) {
    clientPro.write(opercommand.kaichuang);
    dbContrl.saveInfo(req, '卧室', '开窗');
    console.log('\n' + '*****  ' + req.session.user.name + '开窗   ******' + '\n');
    res.status(200).send("开窗ok"); //AJAX请求返回成功
});


router.route('/guanchuang').post(function(req, res) {

    clientPro.write(opercommand.guanchuang);
    dbContrl.saveInfo(req, '卧室', '关窗');
    console.log('\n' + '*****  ' + req.session.user.name + '关窗   ******' + '\n');
    res.status(200).send('关窗ok'); //AJAX请求返回成功
});


router.route('/kaideng').post(function(req, res) {

    clientPro.write(opercommand.kaideng);
    dbContrl.saveInfo(req, '客厅', '开灯');
    console.log('\n' + '*****  ' + req.session.user.name + '开灯   ******' + '\n');
    res.status(200).send('开灯ok'); //AJAX请求返回成功
});


router.route('/guandeng').post(function(req, res) {

    clientPro.write(opercommand.guandeng);
    dbContrl.saveInfo(req, '客厅', '关灯');
    console.log('\n' + '*****  ' + req.session.user.name + '关灯   ******' + '\n');
    res.status(200).send('关灯ok'); //AJAX请求返回成功
});


router.get('/wenshidu', function(req, res) {
    var Wenshidu = global.dbHandel.getModel('wenshidu');
    Wenshidu.find({}).sort('-date').exec(function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('记录 item : ' + doc);
            res.render('wenshidu', {
                title: "温湿度数据返回",
                item: doc
            });
        }; //else
    }); //Wenshidu
})





router.get('/guangzhao', function(req, res) {
    res.render('guangzhao', {
        title: '光照'
    });
});




// 记录页面
router.get('/record', function(req, res, next) {
    var Operate = global.dbHandel.getModel('operate');
    Operate.find({}).sort('-date').exec(function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            // console.log('记录 item : ' + doc);
            res.render("record", {
                title: '操作记录',
                item: doc
            });
        }; //else
    }); //Operate
}); //按时间排序，最近操作排在第一




//设置页面
router.get('/setting', function(req, res, next) {
    res.render('setting', {
        title: '设置'
    }); // 到达此路径则渲染index文件，并传出title值供 index.html使用
});



/* GET logout page. */
router.get("/logout", function(req, res) { // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.user = null;
    req.session.error = null;
    res.redirect("/");
});


module.exports = router;
