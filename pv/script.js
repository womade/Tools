var run = false;
var timer;
var startButton;
var endButton;
var successdiv;
var errordiv;

$(document).ready(function () {
    startButton = $('#startButton');
    endButton = $('#endButton');
    successdiv = $('#successdiv');
    errordiv = $('#errordiv');
});

function refresh() {
    var reg=/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/).+/;
    var url = $('#url').val();
    if(!reg.test(url)){
        endRefresh();
        showerror("🤔 请检查您输入的网址");
        return false;
    }else{
        $('#successdiv').hide();
        $('#successdiv').text("");
        $('#errdiv').hide();
        $('#errdiv').text("");
    }
    if (run) {
        var frame = $('#frame');
        frame.attr('src', url);
        var times = $('#times');
        times.val(parseInt(times.val()) + 1);
        checktimes();
    }
}

function checktimes() {
    if (parseInt($('#refresh-tasks').val()) <= parseInt($('#times').val())) {
        endRefresh();
        showsuccess('😊 刷新任务已完成啦~');
    }else{
        showsuccess('😊 交给我，玩儿去吧~');
  }
}

function startRefresh() {
    run = true;
    try {
        startButton.hide();
        endButton.show();
        successdiv.hide();
        errordiv.hide();
        var frequency = parseInt($('#frequency').val());
        refresh();
        timer = setInterval("refresh()", frequency * 1000);
    } catch (Exception) {
        startButton.show();
        endButton.hide();
        showerror('⚠ 参数出错，刷新重试');
    }
}

function endRefresh() {
    run = false;
    clearInterval(timer);
    startButton.show();
    endButton.hide();
    successdiv.hide();
    errordiv.hide();
}

function showsuccess(msg) {
    $('#successdiv').show();
    $('#successdiv').text(msg);
}

function showerror(msg) {
    $('#errordiv').show();
    $('#errordiv').text(msg);
}