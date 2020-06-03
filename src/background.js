const notificationId = 'colab8-notifier1-unique3-id0';
let notificationTabId = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ thresholdMinutes: 15, notifySound: true, notifyMessage: true });
});

chrome.runtime.onConnect.addListener(port => {
    console.log('connected', port.name);

    if(port.name === 'play-audio') {
        playFinishedCellAudio();
    }

    if(port.name === 'show-message') {
        showFinishedCellNotification();
    }


    if (port.name === 'cell-finished') {
        port.onMessage.addListener(message => {
            notificationTabId = port.sender.tab.id;
            finishedRunning(message).then(result => port.postMessage(result));
        });
    }

});

chrome.notifications.onClicked.addListener(function (id) {
    chrome.tabs.update(notificationTabId, {active: true});
    chrome.notifications.clear(notificationId);
});

const audio = new Audio('./assets/sounds/Air Horn-SoundBible.com-964603082.wav');
audio.volume = 0.6;

function showFinishedCellNotification(runtime) {
    const notificationOptions = {
        type: 'basic',
        title: 'Your Colab cell finished running!',
        message: 'Runtime: ' + msToTime(runtime),
        iconUrl: './assets/icons/icon-128px.png',
        requireInteraction: true,
    }
    chrome.notifications.clear(notificationId,function () {
        chrome.notifications.create(notificationId, notificationOptions);
    });
}

function playFinishedCellAudio() {
    audio.play()
}

async function getValueFromStorage(key) {
    const value = new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], (value) => resolve(value));
    });
    return await value;
}

async function finishedRunning(message) {

    const thresholdMs = parseFloat((await getValueFromStorage('thresholdMinutes')).thresholdMinutes) * 60000;
    const notifySound = (await getValueFromStorage('notifySound')).notifySound;
    const notifyMessage = (await getValueFromStorage('notifyMessage')).notifyMessage;

    if (message.runtimeMs >= thresholdMs) {
        if (notifySound) {
            playFinishedCellAudio();
        }
        if (notifyMessage) {
            showFinishedCellNotification(message.runtimeMs);
        }
        return true;
    }
    return false;
}

function msToTime(duration) {
    if (!duration) {
        return '42h';
    }
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    return hours + ':' + minutes + ':' + seconds;
}
