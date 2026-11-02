import Card from './modules/card.js';
import { Waste, Deck, Tableau, Foundation, Pile } from './modules/piles.js';
import Solitaire from './modules/solitaire.js';
import Renderer from './modules/renderer.js';
import eventSystem from './modules/eventSystem.js';
import Menu from './modules/menu.js';
import { selfOrParentCheck, getChildIdx } from './modules/utils.js';
import Scoring from './modules/scoring.js';

//---- DOM REFERENCES ----//
const gameArea = document.querySelector('.game-container');
const deckSlot = document.getElementById('deck-slot');
const wasteSlot = document.getElementById('waste-slot');
const foundations = [];
const tableaux = [];

const fakeDragDiv = document.getElementById('fake-drag');
document.querySelectorAll('.tableau').forEach(tab => tableaux.push(tab));
document.querySelectorAll('.foundation').forEach(foundation => foundations.push(foundation));

// let's sort them just to be safe, I don't know if querySelectorAll guarantees ordering as they appear in document - though it probably does since tree structure
tableaux.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));
foundations.sort((a, b) => Number(a.id.substring(a.id.length - 1)) > Number(b.id.substring(b.id.length - 1)));




const menu = new Menu();
menu.loadLocalSettings();

const renderer = new Renderer();
renderer.initializeGameDOM(
    {
        deckElement: deckSlot,
        wasteElement: wasteSlot,
        foundationElements: foundations,
        tableauxElements: tableaux,
        fakeDragDiv
    });
renderer.startRendering();
renderer.configureSettings(menu.rendererSettings);

const scoring = new Scoring();


const solitaire = new Solitaire();
solitaire.initialize(menu.gameSettings);

//---- CONTROLLER(S) ----//

let preventDragging = false;
eventSystem.listen('dealing-finished', () => {
    preventDragging = false;

});
eventSystem.listen('dealing', () => {
    preventDragging = true;

});

// firefox drag fix
var globalX, globalY;

// drag controllers
gameArea.addEventListener('dragstart', (evt) => {
    if (preventDragging) {
        evt.preventDefault();
        return;
    }
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, "#waste-slot")
        || selfOrParentCheck(evt, ".tableau")
    ) {
        eventSystem.trigger('drag-start-card', {
            action: "controller",
            cardIdx: getChildIdx(evt.target.parentNode, evt.target),
            fromPile: evt.target.parentNode.id,
            eventData: evt
        });
        evt.dataTransfer.effectAllowed = "move";
        preventDragging = true;

    }
});
/** 
 * Due to a bug (or feature since it's been alive for 15 years) in firefox (see issue: https://bugzilla.mozilla.org/show_bug.cgi?id=505521)
 * Drag event clientX and clientY are always 0. So we set a globalX and Y on dragover on a sufficiently high up DOM element (in this case
 * document) and use them during drag event for position update.
 */
gameArea.addEventListener('drag', (evt) => {
    if(evt.clientX !==0 || evt.clientY !== 0)
    eventSystem.trigger('drag-update', {
        x: evt.clientX,
        y: evt.clientY
    });
    else
    eventSystem.trigger('drag-update', {
        x: globalX,
        y: globalY
    });
});

document.addEventListener('dragover', (evt) => {
    evt.preventDefault();
    // firefox fix
    globalX = evt.clientX;
    globalY = evt.clientY;
    // end firefox fix
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, ".tableau")
        || selfOrParentCheck(evt, '.on-tableau')
        || selfOrParentCheck(evt, '.on-foundation')) {
        eventSystem.trigger('drag-over-pile', {
            action: "controller",
            overPile: evt.target.parentNode.id ? evt.target.parentNode.id : evt.target.id, // if foundation or tableau is empty, i.e. has no children
            eventData: evt
        });
    } else {
        eventSystem.trigger('drag-over-bg');
    }
});

document.addEventListener('drop', (evt) => {
    evt.preventDefault();
    if (selfOrParentCheck(evt, ".foundation")
        || selfOrParentCheck(evt, ".tableau")
        || selfOrParentCheck(evt, '.on-tableau')
        || selfOrParentCheck(evt, '.on-foundation')) {
        eventSystem.trigger('drop-over-pile', {
            action: "controller",
            onPile: evt.target.parentNode.id ? evt.target.parentNode.id : evt.target.id,
            eventData: evt
        });        
    } else {
        eventSystem.trigger('drop-over-bg');
    }
    preventDragging = false;
});

document.addEventListener('dragend', evt => {
    evt.preventDefault();
    preventDragging = false;
    if (evt.dataTransfer.dropEffect === "none") {
        eventSystem.trigger('drop-over-bg');
    }

})

// click controllers
gameArea.addEventListener('click', (evt) => {
    if (selfOrParentCheck(evt, '#deck-slot')) {
        eventSystem.trigger('deck-hit', {});
    }else if(selfOrParentCheck(evt,'.icon')){
        if(selfOrParentCheck(evt,'#undo')){
            eventSystem.trigger('undo-clicked');
        }else if(selfOrParentCheck(evt,'#redo')){
            eventSystem.trigger('redo-clicked');
        }else if(selfOrParentCheck(evt,'#game-options')){
            eventSystem.trigger('settings-clicked');
        }else if(selfOrParentCheck(evt,"#about")){
            eventSystem.trigger('about-clicked');
        }else if(selfOrParentCheck(evt,'#fast-forward')){
            eventSystem.trigger('fast-forward');
        }
    }
});

gameArea.addEventListener('dblclick', (evt) => {
    if (preventDragging
        || !evt.target.parentNode.id)
        return;
    if ((selfOrParentCheck(evt, '.card'))
        && (selfOrParentCheck(evt, '.on-tableau')
            || selfOrParentCheck(evt, '.on-waste'))) {
        eventSystem.trigger('try-collect-card', {
            action: "controller",
            pileId: evt.target.parentNode.id
        });
    }
})

//---- DEBUGGING -----//
eventSystem.saveHistory = true;

window.Card = Card;
window.Waste = Waste;
window.Deck = Deck;
window.Tableau = Tableau;
window.Foundation = Foundation;
window.Pile = Pile;
window.Solitaire = Solitaire;
window.Renderer = Renderer;
window.Menu = Menu;
window.Scoring = Scoring;
window.scoring = scoring;
window.menu = menu;
window.renderer = renderer;
window.solitaire = solitaire;
window.setPreventDragging = (val) => preventDragging = val;
window.EventSys = eventSystem;
window.getSortedEventHistory = (descending=true) => {
    const entries = Object.entries(eventSystem.eventDataHistory);
    // sort the inner arrays first
    entries.forEach(entry => entry[1].sort((a, b) => descending ? b.time-a.time : a.time-b.time));
    //then outer
    entries.sort((a,b)=> descending ? b[1][0].time - a[1][0].time : a[1][0].time-b[1][0].time);
    return entries;
};
Object.defineProperty(window, 'userStats', {
    get: function() {
      return menu.userStats;
    }
  });
window.resetStats = () =>{
    menu.resetStats();
    menu.saveStatsLocal();
} 