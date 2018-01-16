/*
The MIT License (MIT)

Copyright 2016 tigertooth01. All rights reserved.

https://github.com/tigertooth01/jquery-console.js

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function Console (obj) {
    if(!obj) obj = {};
    this.element = (obj.element) ? obj.element : '#debug';
    this.width=(obj.width) ? obj.width : '500';
    this.height=(obj.height) ? obj.height : '100';
    this.bg=(obj.bg) ? obj.bg : '#efefef';
    this.padding=(obj.padding) ? obj.padding : '5';
    this.search_border=(obj.search_border) ? obj.search_border : '1px SOLID #fefefe';
    this.search_btn_border=(obj.search_btn_border) ? obj.search_btn_border : '1px SOLID #ffffff';
    this.search_bg=(obj.search_bg) ? obj.search_bg : '#f8f8f8';
    this.search_btn_bg=(obj.search_btn_bg) ? obj.search_btn_bg : '#fefefe';
    this.search_color=(obj.search_color) ? obj.search_color : '#555';
    this.search_btn_color=(obj.search_btn_color) ? obj.search_btn_color : '#888';
    this.addSearchInput();
    this.applyCss();
}

Console.prototype.applyCss=function(){
    $(this.element).css({
        "width" : this.width+"px",
        "height" : this.height+"px",
        "overflow-y":"auto",
        "background-color":this.bg,
        "padding":this.padding+"px"
    })
};

Console.prototype.addSearchInput=function(){

    var self = this;

    $(this.element).append('<div id="JC_consoleDiv"></div>');

    $('#JC_query').css({
        "border" : this.search_border,
        "background-color" : this.search_bg,
        "color":this.search_color
    });
    
    $('#JC_searchit').css({
        "border" : this.search_btn_border,
        "background-color" : this.search_btn_bg,
        "color":this.search_btn_color
    })

    $('#JC_searchit').click(function(e){
        self.highlightSearch();

    });

    $("#JC_query").keyup(function(event){
        if(event.keyCode == 13){
            $("#JC_searchit").click();
        }
    });

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = ' #JC_consoleDiv span { background-color:#FF9; color:#555; } \n ';
    document.getElementsByTagName('head')[0].appendChild(style);



};

Console.prototype.highlightSearch=function(){

    var text = $("#JC_query").val();
    if(text!="")
    {
        var query = new RegExp("(\\b" + text + "\\b)", "gim");
        var e = $('#JC_consoleDiv').html();
        var enew = e.replace(/(<span>|<\/span>)/igm, "");
        $('#JC_consoleDiv').html(enew);
        var newe = enew.replace(query, "<span>$1</span>");
        $('#JC_consoleDiv').html(newe);
    }
    else{
        var e = $('#JC_consoleDiv').html();
        var enew = e.replace(/(<span>|<\/span>)/igm, "");
        $('#JC_consoleDiv').html(enew);
    }

};

Console.prototype.log = function(msg){
    var d = new Date()
    $('#JC_consoleDiv').append("<p>"+this.formatDate(d,'hh:mm:ss')+":"+msg+"</p>");
    scrollToBottom();
}

Console.prototype.error = function(msg){
    var d = new Date()
    $('#JC_consoleDiv').append("<p style='color:#dd4444'>"+this.formatDate(d,'hh:mm:ss')+":"+msg+"</p>");
    scrollToBottom();
}

Console.prototype.success = function(msg){
    var d = new Date()
    $('#JC_consoleDiv').append("<p style='color:#44aa44'>"+this.formatDate(d,'hh:mm:ss')+":"+msg+"</p>");
    scrollToBottom();
}

Console.prototype.warning = function(msg){
    var d = new Date()
    $('#JC_consoleDiv').append("<p style='color:#ddaa00'>"+this.formatDate(d,'hh:mm:ss')+":"+msg+"</p>");
    scrollToBottom();
}

Console.prototype.clear = function(msg){
    $('#JC_consoleDiv').empty();
    scrollToBottom();
}

scrollToBottom = function() {
    let divContainer = $("#JC_consoleDiv").parent();
    divContainer.scrollTop(divContainer[0].scrollHeight);
}


Console.prototype.formatDate = function(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};

Console.prototype.show = function(msg){

    $(this.element).show();
}

Console.prototype.hide = function(msg){

    $(this.element).hide();
}