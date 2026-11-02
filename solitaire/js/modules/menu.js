import eventSystem from "./eventSystem.js";
import { selfOrParentCheck } from "./utils.js";

//import { buildOptionsPopup } from "./popups/optionsPopup.js";
const ANIMATION_SPEED_PRESETS = {
    'turtle': {
        flipDuration: 300,
        moveSpeed: 500,
        dropSpeed: 500,
    },
    'slow': {
        flipDuration: 200,
        moveSpeed: 2000,
        dropSpeed: 1000,
    },
    'normal': {
        flipDuration: 150,
        moveSpeed: 5000,
        dropSpeed: 2000,
    },
    'fast': {
        flipDuration: 100,
        moveSpeed: 7500,
        dropSpeed: 3000,
    },
    'lightning': {
        flipDuration: 50,
        moveSpeed: 10000,
        dropSpeed: 5000,
    }
}

// Here, due to time constraints, we're breaking the MVC architecture. This class is both model, controller and view for all game-options
export default class Menu {
    constructor() {
        this.gameSettings = {
            difficulty: 3,
            timerMode: false,
            scoring: false,
            thoughtfulSol: true,
            passes: 0
        };
        this.rendererSettings = {
            enableAnimations: true,
            feedbackDragged: true,
            feedbackDragOver: true,
            animationSpeeds: ANIMATION_SPEED_PRESETS.normal,
            redDeck: false
        };
        this.audioSettings = {
            music_enabled: false,
            music_volume: 0,
        };
        this.tempSettings = {};
        

        // DOM references
        this.overlayEl = document.querySelector('.overlay');
        this.popupContainer = document.getElementById('options-popup');
        this.popupFooter = document.querySelector('#options-popup .popup-footer');
        this.aboutFooter = document.querySelector('#about-popup .popup-footer');
        this.btnNewGame = document.getElementById('new-game');
        this.pregameMsg = document.getElementById('pre-game');
        this.postgameMsg = document.getElementById('post-game');
        this.difficultyMsg = document.getElementById('difficulty-msg');
        this.btnUndo = document.getElementById('undo');
        this.btnRedo = document.getElementById('redo');
        this.btnFastForward = document.getElementById('fast-forward');
        this.scoreBoardElement = document.getElementById('scoreboard');
        this.scoreElement = document.getElementById('score');
        this.audio = null;

        // ~Constants
        this.victoryMsgInner = `<h2>Congratulations!</h2><h3>You won!</h3>`;
        this.lossMsgInner = `<h2>Sorry!</h2><h3>You couldn't win. Better luck next time</h3>`;
        this.musicSrc = './assets/summer-walk-152722.mp3'


        // Change listeners for <select> elements so they'll correctly update our model
        document.getElementById('animationSpeeds').onchange = () => {
            this._updateTempOptions();
            this.optionsController();
        };

        document.getElementById('passes').onchange = () => {
            this._updateTempOptions();
            this.optionsController();
        }

        // bindings
        this.onGameInitialized = this.onGameInitialized.bind(this);
        this.loadLocalSettings = this.loadLocalSettings.bind(this);
        this.onSettingsClicked = this.onSettingsClicked.bind(this);
        this.optionsController = this.optionsController.bind(this);
        this._buildOptionsButtons = this._buildOptionsButtons.bind(this);
        this.hideNewGameButton = this.hideNewGameButton.bind(this);
        this.showNewGameButton = this.showNewGameButton.bind(this);
        this.showPreGameMessage = this.showPreGameMessage.bind(this);
        this.hidePreGameMessage = this.hidePreGameMessage.bind(this);
        this.newGame = this.newGame.bind(this);
        this.showGameEndedMsg = this.showGameEndedMsg.bind(this);
        this.onGameLoaded = this.onGameLoaded.bind(this);
        this.onFastForwardAvailable = this.onFastForwardAvailable.bind(this);
        this.onHistoryUpdate = this.onHistoryUpdate.bind(this);
        this.onAboutClicked = this.onAboutClicked.bind(this);
        this.onUpdateScore = this.onUpdateScore.bind(this);
        this.updateGamesPlayed = this.updateGamesPlayed.bind(this);
        this.updateGamesFinished = this.updateGamesFinished.bind(this);
        this.resetStats = this.resetStats.bind(this);
        this.saveStatsLocal = this.saveStatsLocal.bind(this);
        this.loadLocalStats = this.loadLocalStats.bind(this);

        // custom event listeners
        eventSystem.listen('game-initialized', this.onGameInitialized);
        eventSystem.listen('settings-clicked', this.onSettingsClicked);
        eventSystem.listen('dealing-finished', this.showNewGameButton);
        eventSystem.listen('dealing-finished', this.updateGamesPlayed);
        eventSystem.listen('dealing', this.hidePreGameMessage);
        eventSystem.listen('game-ended', this.showGameEndedMsg);
        eventSystem.listen('game-ended', this.updateGamesFinished);
        eventSystem.listen('game-load-finished', this.onGameLoaded);
        eventSystem.listen('fast-forward-possible', this.onFastForwardAvailable);
        eventSystem.listen('history-update', this.onHistoryUpdate);
        eventSystem.listen('about-clicked', this.onAboutClicked);
        eventSystem.listen('score-updated', this.onUpdateScore);

        // delegating click events for pop-ups
        this.overlayEl.addEventListener('click', (evt) => {
            if (!selfOrParentCheck(evt, '#options-popup')) {
                this.hideAbout();
                this.hideOverlay();
                this.onOptionsCancelled();
            } else {
                this.hideAbout();
                this._updateTempOptions();
                this.optionsController(evt);
            }
        });
        this.btnNewGame.addEventListener('click', this.newGame);

        // beta feature for a friend
        this.localStats = {};
        this.resetStats();

        // try to autoplay (or not) based on current user settings
        this.handleAudioRendering();
    }

    // New game and popup-related functions
    newGame() {
        this.hideAllThoughtfulButtons();
        this.hideFFButton();
        eventSystem.trigger('new-game', {
            action: "user",
            ...this.gameSettings
        });
    }


    showOverlay() {
        this.showElement(this.overlayEl);
    }

    hideOverlay() {
        this.hideElement(this.overlayEl);
    }

    showNewGameButton() {
        this.showElement(this.btnNewGame);
    }

    hideNewGameButton() {
        this.hideElement(this.btnNewGame);
    }

    showPreGameMessage(diff) {
        this.difficultyMsg.innerHTML = diff;
        this.showElement(this.pregameMsg);
    }

    hidePreGameMessage() {
        this.hideElement(this.pregameMsg);
    }

    makeVictoryMessage(score) {
        let victoryMsg = this.victoryMsgInner;
        if (this.currentSettings.game.scoring) {
            victoryMsg += `\n<h3 class="winner-score">Your score: ${score}</h3>`;
        }
        return victoryMsg;
    }

    showGameEndedMsg({ victoryStatus, score }) {
        this.postgameMsg.innerHTML = !!victoryStatus ? this.makeVictoryMessage(score) : this.lossMsgInner;
        this.hideAllThoughtfulButtons();
        this.hideFFButton();
        this.showElement(this.postgameMsg);
    }

    hideGameEndedMsg() {
        this.hideElement(this.postgameMsg);
    }

    showElement(elem) {
        elem.classList.add('show');
        setTimeout(() => {
            elem.style.opacity = 1;
        }, 50);
    }

    hideElement(elem) {
        elem.style.opacity = 0;
        setTimeout(() => {
            elem.classList.remove('show');
        }, 300);
    }

    onOptionsCancelled() {
        eventSystem.trigger('options-menu-cancelled');
        this.tempSettings = {};
    }

    onGameLoaded() {
        this.hideAllThoughtfulButtons();
        this.hideScoreboard();
        this.hideFFButton();
        this.hideGameEndedMsg();
        this.hidePreGameMessage();
        this.showNewGameButton();
    }

    // Scoreboard Actions
    showScoreBoard() {
        this.showElement(this.scoreBoardElement);
    }

    hideScoreboard() {
        this.hideElement(this.scoreBoardElement);
    }

    onUpdateScore(data) {
        if (!this.currentSettings.game.scoring) return;
        if (this.currentSettings.renderer.enableAnimations) {
            this._animateScoreUpdate(data.currentScore);
        } else {
            this.scoreElement.innerText = data.currentScore;
        }
    }

    _animateScoreUpdate(newScore) {
        const previousScore = Number(this.scoreElement.innerText);
        this.scoreElement.innerText = newScore;
        if (previousScore > Number(newScore)) {
            this.scoreElement.classList.add('pulse-it', 'score-decreased');
        } else if (previousScore < Number(newScore)) {
            this.scoreElement.classList.add('pulse-it', 'score-increased');
        } else {
            return;
        }
        setTimeout(() => this.scoreElement.classList.remove('pulse-it', 'score-increased', 'score-decreased'), 500);
    }


    // Game Settings Actions
    onGameInitialized({ settings }) {
        // store settings when game begins
        this.gameSettings = settings;
        this.hideGameEndedMsg();
        this.hideNewGameButton();
        this.scoreElement.innerText = "0";
        this.gameSettings.scoring ? this.showScoreBoard() : this.hideScoreboard();
        const msg = `Draw-${this.gameSettings.difficulty},${this.gameSettings.thoughtfulSol ? 'unlimited undos' : 'no undos'}, ${this.gameSettings.passes > 0 ? this.gameSettings.passes : 'unlimited'}-passes through stock${this.gameSettings.scoring ? '<div class="scored-game">\nSCORED GAME</div>' : '<div class="unscored-game">UN-SCORED GAME</div><div style="padding-top:5px;">(to enable scoring, go to game settings, disable "thoughtful mode" and enable "scoring")</div>'}`;
        this.showPreGameMessage(msg);
    }

    getPresetName(animationSpeeds) {
        return Object.keys(ANIMATION_SPEED_PRESETS).find(key => ANIMATION_SPEED_PRESETS[key].flipDuration === animationSpeeds.flipDuration);
    }


    onSettingsClicked() {
        this.tempSettings = JSON.parse(JSON.stringify(this.currentSettings));
        this.hideAbout();
        this._buildOptionsButtons();
        this.popupFooter.firstChild.remove();
        this.popupFooter.appendChild(this.btnContainer);
        this._handleVisualsSection();
        this._handleGameSection();
        this._handleAudioSection();
        this.showOverlay();
    }

    applySettings() {
        this.rendererSettings = JSON.parse(JSON.stringify(this.tempSettings.renderer));
        this.gameSettings = JSON.parse(JSON.stringify(this.tempSettings.game));
        this.audioSettings = JSON.parse(JSON.stringify(this.tempSettings.audio));
        this.tempSettings = {};
        this.saveSettingsLocal();
    }

    onGameSettingsChanged() {
        this.applySettings();
        this.hideAllThoughtfulButtons();
        this.hideFFButton();
        this.handleAudioRendering();
        eventSystem.trigger('game-settings-changed', {
            action: 'settings-changed',
            ...this.gameSettings,
            ...this.currentSettings
        });
    }

    onRendererSettingsChanged() {
        this.applySettings();
        this.handleAudioRendering();
        eventSystem.trigger('av-settings-changed', {
            action: 'settings-changed',
            renderer: this.currentSettings.renderer,
            audio: this.currentSettings.audio,
        });
    }
    handleAudioRendering() {
        if (this.currentSettings.audio.music_enabled) {
            if (!this.audio) {
                // If it doesn't exist, create a new audio element.
                this.audio = document.createElement("audio");
                // Set the audio properties.
                this.audio.loop = true;
                this.audio.autoplay = true;
                this.audio.volume = this.currentSettings.audio.music_volume;
                this.audio.controls = false;
                document.body.appendChild(this.audio);
                this.audio.src = this.musicSrc;
                this.audio.load();
                this.audio.oncanplaythrough = () => {
                    this.audio.play();
                }

            } else {
                this.audio.volume = this.currentSettings.audio.music_volume;
                if (this.audio.paused)
                    this.audio.play();
            }
        } else {
            if (this.audio) {
                this.audio.pause();
                document.body.removeChild(this.audio);
                this.audio = null;
            }
        }
    }

    // build the various buttons for options popup
    _buildOptionsButtons() {
        this.btnContainer = document.createElement('div');
        this.btnContainer.style.display = 'flex';
        this.btnContainer.style.justifyContent = 'center';
        this.applyBtn = document.createElement('button');
        this.applyBtn.style.backgroundColor = 'lime';
        this.applyBtn.style.color = 'black';
        this.applyBtn.innerText = 'Apply';
        this.applyBtn.classList.add('hide');
        this.applyAndRestartBtn = document.createElement('button');
        this.applyAndRestartBtn.style.backgroundColor = 'lime';
        this.applyAndRestartBtn.style.color = 'black';
        this.applyAndRestartBtn.innerText = 'Apply & Restart';
        this.applyAndRestartBtn.classList.add('hide');
        this.cancelBtn = document.createElement('button');
        this.cancelBtn.innerText = 'Cancel';
        this.cancelBtn.style.backgroundColor = 'orange';
        this.cancelBtn.style.color = 'black';
        this.cancelBtn.classList.add('hide');
        this.okBtn = document.createElement('button');
        this.okBtn.innerText = 'OK';
        this.btnContainer.appendChild(this.applyAndRestartBtn);
        this.btnContainer.appendChild(this.applyBtn);
        this.btnContainer.appendChild(this.okBtn);
        this.btnContainer.appendChild(this.cancelBtn);
    }

    // options pop-up controller
    optionsController(evt) {
        if (!this.tempSettings) return;

        const visualsChanged = JSON.stringify(this.tempSettings.renderer) !== JSON.stringify(this.currentSettings.renderer);
        const audioChanged = JSON.stringify(this.tempSettings.audio) !== JSON.stringify(this.currentSettings.audio);
        const gameChanged = JSON.stringify(this.tempSettings.game) !== JSON.stringify(this.currentSettings.game);
        this.popupFooter.firstChild.remove();
        this.popupFooter.appendChild(this.btnContainer);
        for (let child of this.btnContainer.children) {
            child.classList.add('hide');
        }
        if (gameChanged) {
            this.applyAndRestartBtn.classList.remove('hide');
            this.cancelBtn.classList.remove('hide');
        } else if (audioChanged || visualsChanged) {
            this.applyBtn.classList.remove('hide');
            this.cancelBtn.classList.remove('hide');
        } else {
            this.okBtn.classList.remove('hide');
        }

        if (!evt) return;
        if (selfOrParentCheck(evt, '.visuals')) {
            this._handleVisualsSection();
        } else if (selfOrParentCheck(evt, '.game')) {
            this._handleGameSection();
        } else if (selfOrParentCheck(evt, '.audio')) {
            this._handleAudioSection();
        } else if (selfOrParentCheck(evt, '.popup-footer')) {
            if (evt.target === this.cancelBtn || evt.target === this.okBtn) {
                this.onOptionsCancelled();
                this.hideOverlay();
            } else if (evt.target === this.applyAndRestartBtn) {
                this.onGameSettingsChanged();
                this.hideOverlay();
            } else if (evt.target === this.applyBtn) {
                this.onRendererSettingsChanged();
                this.hideOverlay();
            }
        }
    }

    // options popup views
    _handleVisualsSection() {
        const deckColorRed = document.getElementById('reddeck');
        const deckColorBlue = document.getElementById('bluedeck');

        deckColorRed.checked = !!this.tempSettings.renderer.redDeck;
        deckColorBlue.checked = !!!this.tempSettings.renderer.redDeck;

        const draggedCardsChkbox = document.getElementById('feedbackDragged');
        const draggedOverChkbox = document.getElementById('feedbackDragOver');

        draggedCardsChkbox.checked = !!this.tempSettings.renderer.feedbackDragged;
        draggedOverChkbox.checked = !!this.tempSettings.renderer.feedbackDragOver;

        const animationsChkbox = document.getElementById('enableAnimations');

        animationsChkbox.checked = !!this.tempSettings.renderer.enableAnimations;

        const animationSpeedsDiv = document.getElementById('animation-speeds-div');
        if (this.tempSettings.renderer.enableAnimations) {
            animationSpeedsDiv.classList.remove('hide');
            const selectSpeed = document.getElementById('animationSpeeds');
            for (let child of selectSpeed) {
                child.selected = !!(child.value.toLowerCase() === this.getPresetName(this.tempSettings.renderer.animationSpeeds));
            }
        } else {
            animationSpeedsDiv.classList.add('hide');
        }
    }

    _handleGameSection() {
        const thoughtfulChkbox = document.getElementById('thoughtfulSol');
        thoughtfulChkbox.checked = !!this.tempSettings.game.thoughtfulSol;

        const scoringSpan = document.getElementById('scoring-span');
        if (!!!this.tempSettings.game.thoughtfulSol) {
            scoringSpan.classList.remove('hide');
            const scoringChkbx = document.getElementById('scoring');
            scoringChkbx.checked = !!this.tempSettings.game.scoring;
        } else {
            scoringSpan.classList.add('hide');
        }

        const draw1 = document.getElementById('draw-1');
        const draw3 = document.getElementById('draw-3');

        draw1.checked = this.tempSettings.game.difficulty != 3;
        draw3.checked = !!!draw1.checked;

        const passSelect = document.getElementById('passes');
        for (let child of passSelect) {
            child.selected = child.value == this.tempSettings.game.passes;
        }

    }

    _handleAudioSection() {
        const musicChkbox = document.getElementById('music_enabled');
        musicChkbox.checked = !!this.tempSettings.audio.music_enabled;


        const musicSlider = document.getElementById('music_volume');
        if (!!this.tempSettings.audio.music_enabled) {
            musicSlider.removeAttribute('disabled');
            musicSlider.value = this.tempSettings.audio.music_volume * 100;
        } else {
            musicSlider.setAttribute('disabled', true);
        }

    }

    // options popup model
    _updateTempOptions() {
        if (!this.tempSettings) return;

        const deckColorRed = document.getElementById('reddeck');
        this.tempSettings.renderer.redDeck = deckColorRed.checked;

        const draggedCardsChkbox = document.getElementById('feedbackDragged');
        const draggedOverChkbox = document.getElementById('feedbackDragOver');

        this.tempSettings.renderer.feedbackDragged = !!draggedCardsChkbox.checked;
        this.tempSettings.renderer.feedbackDragOver = !!draggedOverChkbox.checked;

        const animationsChkbox = document.getElementById('enableAnimations');
        this.tempSettings.renderer.enableAnimations = !!animationsChkbox.checked;
        if (this.tempSettings.renderer.enableAnimations) {
            const selectSpeed = document.getElementById('animationSpeeds');
            this.tempSettings.renderer.animationSpeeds = ANIMATION_SPEED_PRESETS[selectSpeed.value.toLowerCase()];
        }
        const thoughtfulChkbox = document.getElementById('thoughtfulSol');
        this.tempSettings.game.thoughtfulSol = !!thoughtfulChkbox.checked;

        const scoringChkbx = document.getElementById('scoring');
        if (!!!this.tempSettings.game.thoughtfulSol) {
            this.tempSettings.game.scoring = !!scoringChkbx.checked;
        } else {
            this.tempSettings.game.scoring = false;
        }

        const draw1 = document.getElementById('draw-1');
        this.tempSettings.game.difficulty = (!!draw1.checked) ? 1 : 3;

        const passSelect = document.getElementById('passes');
        this.tempSettings.game.passes = Number(passSelect.value);

        const musicChkbox = document.getElementById('music_enabled');


        this.tempSettings.audio.music_enabled = !!musicChkbox.checked;
        if (this.tempSettings.audio.music_enabled) {
            const musicSlider = document.getElementById('music_volume');
            this.tempSettings.audio.music_volume = musicSlider.value / 100;
            if (this.audio) {
                this.audio.volume = this.tempSettings.audio.music_volume;
            } else {
                this.handleAudioRendering();
            }
        }
    }

    // About Actions

    onAboutClicked() {
        if (Object.keys(this.tempSettings).length) return;
        const popup = document.getElementById('about-popup');
        popup.classList.remove('hide')
        const options = document.getElementById('options-popup');
        options.classList.add('hide');
        this.showOverlay();
    }

    hideAbout() {
        const popup = document.getElementById('about-popup');
        popup.classList.add('hide');
        const options = document.getElementById('options-popup');
        setTimeout(() => options.classList.remove('hide'), 300);
    }
    // Fast-forward/undo/redo
    onHistoryUpdate({ history, undo }) {
        if (this.currentSettings.game.thoughtfulSol) {
            if (history.length) {
                this.showUndoButton();
            } else {
                this.hideUndoButton();
            }
            if (undo.length) {
                this.showRedoButton();
            } else {
                this.hideRedoButton();
            }
        } else {
            this.hideAllThoughtfulButtons();
        }
    }


    onFastForwardAvailable() {
        this.showFFButton();
    }

    showUndoButton() {
        this.showElement(this.btnUndo);
    }

    hideUndoButton() {
        this.hideElement(this.btnUndo);
    }

    showRedoButton() {
        this.showElement(this.btnRedo);
    }

    hideRedoButton() {
        this.hideElement(this.btnRedo);
    }

    hideAllThoughtfulButtons() {
        this.hideRedoButton();
        this.hideUndoButton();
    }

    showFFButton() {
        this.showElement(this.btnFastForward);
    }

    hideFFButton() {
        this.hideElement(this.btnFastForward);
    }

    // getters and savers
    get currentSettings() {
        const renderer = this.rendererSettings;
        const game = this.gameSettings;
        const audio = this.audioSettings;
        return {
            game,
            renderer,
            audio,
        }
    }

    // Retrieving localStorage - throws if unsuccessful
    get _localSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('allSettings'));
            const renderer = settings.renderer;
            const game = settings.game;
            const audio = settings.audio;
            return {
                game,
                renderer,
                audio,
            }
        } catch (e) {
            console.warn(`Couldn't load local store:\n`, e);
            throw e;
        }
    }

    get _localStats() {
        try {
            const localStats = JSON.parse(localStorage.getItem('localStats'));
            if(localStats) 
                return localStats;
            else
                throw new Error('Local Store item not found');
        } catch (e) {
            console.warn(`Couln't load local store:\n`, e);
            throw e;
        }
    }

    get userStats(){
        return {
            ...this.localStats,
            "Scored Win Rate": `${(this.localStats.scoredGamesWon/this.localStats.scoredGamesStarted * 100).toFixed(2)}%`,
            "Unscored Win Rate": `${(this.localStats.unscoredGamesWon/this.localStats.unscoredGamesStarted * 100).toFixed(2)}%`,
            "Total Win Rate": `${((this.localStats.scoredGamesWon + this.localStats.unscoredGamesWon)/(this.localStats.unscoredGamesStarted + this.localStats.scoredGamesStarted)*100).toFixed(2)}%`,
            "Average Score Per Scored Games Started": `${Math.round(this.localStats.totalScore/this.localStats.scoredGamesStarted)}`,
            "Average Score Per Scored Games Won": `${Math.round(this.localStats.totalScore/this.localStats.scoredGamesWon)}`,
            "Total Games Played": this.localStats.unscoredGamesStarted + this.localStats.scoredGamesStarted,
            "Total Games Won": this.localStats.scoredGamesWon + this.localStats.unscoredGamesWon,
        }
    }

    // use this to get a valid setting, will return defaults or current if fails to load localStorage
    loadLocalSettings() {
        try {
            const settings = this._localSettings;
            this.gameSettings = settings.game;
            this.rendererSettings = settings.renderer;
            this.audioSettings = settings.audio;
        } catch (e) {
            console.warn('Loading defaults/current settings');
            return this.currentSettings;
        }
    }

    loadLocalStats(){
        try{
            const localStats = this._localStats;
            this.localStats = localStats;
        }catch(e){
            console.warn(`Resetting local stats`);
            this.resetStats();
        }
    }

    // saving settings to localStorage
    saveSettingsLocal() {
        try {
            localStorage.setItem('allSettings', JSON.stringify(this.currentSettings));
        } catch (e) {
            console.error('Failed to save settings.', e);
        }
    }

    saveStatsLocal(){
        try {
            localStorage.setItem('localStats', JSON.stringify(this.localStats));
        } catch (e) {
            console.error('Failed to save stats.', e);
        }
    }

    updateGamesPlayed() {
        this.loadLocalStats();
        if (this.currentSettings.game.scoring) {
            this.localStats.scoredGamesStarted++;
        } else {
            this.localStats.unscoredGamesStarted++;
        }
        this.saveStatsLocal();
    }

    updateGamesFinished({ victoryStatus, score }) {
        this.loadLocalStats();
        if (this.currentSettings.game.scoring) {
            if (victoryStatus) {
                this.localStats.scoredGamesWon++;
                this.localStats.totalScore += score;
            }
        } else {
            if (victoryStatus) {
                this.localStats.unscoredGamesWon++;
            }
        }
        this.saveStatsLocal();
    }

    resetStats() {
        this.localStats = {
            scoredGamesStarted: 0,
            unscoredGamesStarted: 0,
            scoredGamesWon: 0,
            unscoredGamesWon: 0,
            totalScore: 0,
        };
    }
}