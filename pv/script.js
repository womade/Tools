var run = false;
var timer;
var startButton;
var endButton;

$(document).ready(function () {
    startButton = $('#startButton');
    endButton = $('#endButton');
});

function refresh() {
    var reg=/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/).+/;
    var url = $('#url').val();
    if(!reg.test(url)){
        showmsg("请输入合法的网址");
        return false;
        
    }else{
        $('#errdiv').hide();
        $('#errdiv').text("");
    }

    if (run) {
        var frame = $('#frame');
        frame.attr('src', url);
        var times = $('#times');
        times.val(parseInt(times.val()) + 1);
    }
}

function startRefresh() {


    run = true;
    try {
        startButton.hide();
        endButton.show();
        var frequency = parseInt($('#frequency').val());
        refresh();
        timer = setInterval("refresh()", frequency * 1000);
    } catch (Exception) {
        startButton.show();
        endButton.hide();
        showmsg('设置错误');
    }
}

function endRefresh() {
    run = false;
    clearInterval(timer);
    startButton.show();
    endButton.hide();
}
function showmsg(msg) {
    $('#errdiv').show();
    $('#errdiv').text(msg);
}