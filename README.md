ngrok -config ngrok.cfg -subdomain 481b4659.ngrok.com 3000


//步进电机顺时针转（开窗）
26 53 52 53 00 00 00 00 00 00 00 00 00 00 42 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A
//步进电机逆时针转（关窗）
26 53 52 53 00 00 00 00 00 00 00 00 00 00 42 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A


//开继电器1（开灯）
26 53 52 53 00 00 00 00 00 00 00 00 00 00 4A 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A
//关继电器1（关灯）
26 53 52 53 00 00 00 00 00 00 00 00 00 00 4A 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A


//开继电器2
26 53 52 53 00 00 00 00 00 00 00 00 00 00 4A 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A
//关继电器2
26 53 52 53 00 00 00 00 00 00 00 00 00 00 4A 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A


//回家模式（开继电器1,2 步进顺）
26 53 52 53 00 00 00 00 00 00 00 00 00 00 5A 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A、
//离家模式(关继电器1,2，步进逆)
26 53 52 53 00 00 00 00 00 00 00 00 00 00 5A 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 2A




// var item = <%= item %>;
// console.log(item);

var title = <%= title%>
console.log(title);

var wsddata = [];
var wendu = [];
var shidu = [];

var wsddata = ['1号','2号','3号','4号','5号','6号','7号'];
var wendu = [23, 24, 30, 33, 25, 26.5, 30.6];
var shidu = [43, 59, 90, 26, 28, 70, 76];
for(var i=0; i<15;i++) {
     wsddata[i] = item[i].date.toLocaleString();
     wendu[i]   = Number(item[i].temperature);
     shidu[i]   = Number(item[i].humidity);
}
console.log(wsddata);
console.log(wendu);
console.log(shidu);



// var wendu[i]   = '<%=item[i].temperature%>'
// var shidu[i]   = '<%=item[i].humidity%>'













var wsddata =  [];


    <% for(var i = 0; i < 10 ;i++) {%>
      <%   wsddata[i]= item[i].date.toLocaleString() %>
    <% } %>
        console.log(wsddata);
