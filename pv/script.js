var run = false;
var timer;
var startButton;
var endButton;
var successdiv;
var errordiv;
var noSleep = new NoSleep();
var wakeLockEnabled = false;

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
        showerror("🤔 请检查您输入的网址……");
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
        updateFrequency();
        updateRefreshTasks()
        updateProgress(parseInt($('#times').val()), parseInt($('#task-count').val()));
        remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val())) * parseInt($('#frequency').val());
        checktimes();
    }
}

function checktimes() {
    if (parseInt($('#task-count').val()) <= parseInt($('#times').val())) {
        endRefresh();
        showsuccess('😉 刷新任务已完成啦~');
        $('#remainingTime').text('00:00:00');
    }else{
        showsuccess('😉 交给我，玩儿去吧~');
  }
}

function updateFrequency() {
    $('input[id="frequency"]').change(function() {
        if (run) {
            clearInterval(timer);
            var newFrequency = parseInt($('#frequency').val());
            remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val())) * parseInt($('#frequency').val());
            updateProgress(parseInt($('#times').val()), parseInt($('#task-count').val()));
            timer = setInterval(refresh, newFrequency * 1000);
        }
    });
}

function updateRefreshTasks() {
    $('input[id="task-count"]').change(function() {
        if (run) {
            remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val())) * parseInt($('#frequency').val());
            updateProgress(parseInt($('#times').val()), parseInt($('#task-count').val()));
        }
    });
}

function updateProgress(currentTimes, totalTasks) {
    var percentage = (currentTimes / totalTasks) * 100;
    var percentageRounded = parseFloat(percentage.toFixed(2));
    $('.progress-bar').css('width', percentageRounded + '%').text(percentageRounded + '%');
}

var remainingTasks = parseInt($('#task-count').val()) - parseInt($('#times').val());

function updateDisplayTime(remainingSeconds) {
    let hours = Math.floor(remainingSeconds / 3600);
    let minutes = Math.floor((remainingSeconds % 3600) / 60);
    let seconds = remainingSeconds % 60;
    let formattedTime = hours.toString().padStart(2, '0') + ":" +
                        minutes.toString().padStart(2, '0') + ":" +
                        seconds.toString().padStart(2, '0');
    $('#remainingTime').text(formattedTime);
}

function startRefresh() {
    run = true;
    try {
        remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val())) * parseInt($('#frequency').val());
        countdownTimer = setInterval(function() {
            if (remainingSeconds > 0) {
                remainingSeconds--;
                updateDisplayTime(remainingSeconds);
                } else {
                    clearInterval(countdownTimer);
                    //$('#remainingTime').text('00:00:00');
                }
        }, 1000);
        startButton.hide();
        endButton.show();
        successdiv.hide();
        errordiv.hide();
        noSleep.enable();
        var frequency = parseInt($('#frequency').val());
        refresh();
        timer = setInterval("refresh()", frequency * 1000);
    } catch (Exception) {
        startButton.show();
        endButton.hide();
        showerror('⚠ 参数出错，刷新重试！');
    }
}

function endRefresh() {
    run = false;
    clearInterval(timer);
    clearInterval(countdownTimer);
    startButton.show();
    endButton.hide();
    successdiv.hide();
    errordiv.hide();
    noSleep.disable();
}

function cleanAll() {
    endRefresh();
    updateProgress(0, 100);
    document.getElementById('url').value = '';
    document.getElementById('frequency').value = '10';
    document.getElementById('task-count').value = '1024';
    document.getElementById('times').value = '0';
    showsuccess('🆑 已成功清空配置啦~');
    var successDivElement = document.getElementById('successdiv');
    setTimeout(function() {
        successDivElement.style.display = 'none';
    }, 3000);
    $('#remainingTime').text('00:00:00');
}

function showsuccess(msg) {
    $('#successdiv').show();
    $('#successdiv').text(msg);
}

function showerror(msg) {
    $('#errordiv').show();
    $('#errordiv').text(msg);
}