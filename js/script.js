const randomHealthRange = 2;
const testingMinionNum = {
  player: 5,
  opponent: 5
};
const templateCardSize = {
  width: 400,
  height: 543
};
const zoomRatio = 0.4;


class Minion {
  constructor(health, divineShield, spellDamage, deathrattle) {
    this.health = health;
    this.divineShield = divineShield;
    this.spellDamage = spellDamage;
    this.deathrattle = deathrattle;
  }

  toPrintableString() {
    return `health: ${this.health}, divineShield: ${this.divineShield}, spellDamage: ${this.spellDamage}`;
  }

  hasDivineShield() {
    return this.divineShield;
  }
}


class Battlefield {
  constructor(name, canvas, setCanvasSize=true) {
    this.name = name;
    this.minions = [];
    this.boardSpellDamage = 0;

    if(setCanvasSize) {
      canvas.width = templateCardSize.width * 7 * zoomRatio;
      canvas.height = templateCardSize.height * zoomRatio;
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  generateTestingMinions(minionNum) {
    for(let i = 0; i < minionNum; i++) {
      let randomHealth = Math.floor(Math.random() * randomHealthRange + 1),
          randomDivineShield = Math.floor(Math.random() * 2),
          randomSpellDamage = Math.floor(Math.random() * 2);

      this.minions.push(new Minion(randomHealth, randomDivineShield,
        randomSpellDamage, 0));
    }
  }

  printMinions() {
    console.log(`${this.name}'s minions:`);

    if(this.minions.length == 0)
      console.log('<empty>');
    else {
      for(let i = 0; i < this.minions.length; i++)
        console.log(`(${i}) ${this.minions[i].toPrintableString()}`);
    }

    this.renderMinions();
  }

  renderMinions() {
    let minionNum = this.minions.length,
        startX = (this.canvas.width - templateCardSize.width * minionNum * zoomRatio) / 2;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.width);
    this.ctx.font = (80 * zoomRatio) + 'px BelweBoldBT';
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(this.name, 0, 100 * zoomRatio);

    for(let i = 0; i < minionNum; i++) {
      let x = startX + templateCardSize.width * i * zoomRatio;
      drawCard(this.ctx, this.minions[i], x, 0);
    }

    function drawCard(ctx, minion, x, y) {
      let fontSize = 100 * zoomRatio,
          descriptionFontSize = {
            divineShield: 30 * zoomRatio,
            spellDamage: 28 * zoomRatio
          };

      ctx.beginPath();
      ctx.textAlign = 'center';

      ctx.drawImage(
        templateCardImage, x, y,
        Math.floor(templateCardSize.width * zoomRatio),
        Math.floor(templateCardSize.height * zoomRatio)
      );

      ctx.font = fontSize + 'px BelweBoldBT';
      ctx.fillStyle = '#FFF';
      ctx.fillText(minion.health, x + 350 * zoomRatio, 515 * zoomRatio);

      ctx.lineWidth = 5 * zoomRatio;
      ctx.strokeText(minion.health, x + 350 * zoomRatio, 515   * zoomRatio);

      let textDivineShield = '',
          textSpellDamage = '';

      if(minion.hasDivineShield())
        textDivineShield = 'Divine Shield';

      ctx.font = 'bold ' + descriptionFontSize.divineShield + 'px FranklinGothicStdCondensed';
      ctx.fillStyle = '#000';
      ctx.fillText(textDivineShield, x + templateCardSize.width * zoomRatio / 2, 395 * zoomRatio);

      if(minion.spellDamage > 0)
        textSpellDamage = `Spell Damage +${minion.spellDamage}`;

      ctx.font = 'bold ' + descriptionFontSize.spellDamage + 'px FranklinGothicStdCondensed';
      ctx.fillStyle = '#000';
      ctx.fillText(textSpellDamage, x + templateCardSize.width * zoomRatio / 2, 435 * zoomRatio);
    }
  }

  updateBoardSpellDamage() {
    this.boardSpellDamage = 0;
    for(let i = 0; i < this.minions.length; i++)
      this.boardSpellDamage += this.minions[i].spellDamage;
  }

  dealDamagesToMinions(damage) {
    for(let i = 0; i < this.minions.length; i++) {
      let minion = this.minions[i];
      if(minion.hasDivineShield())
        minion.divineShield = 0;
      else
        this.minions[i].health -= damage;
    }
  }

  // returns how many minions died
  updateMinionsState() {
    if(this.minions.length == 0)
      return 0;

    let numOfMinionsDied = 0;
    for(let i = 0; i < this.minions.length; i++) {
      if(this.minions[i].health <= 0) {
        numOfMinionsDied += 1;
        this.minions.splice(i, 1);
        i--;
      }
    }

    return numOfMinionsDied;
  }
}

let playerCanvas = document.getElementById('playerCanvas'),
    playerBattlefield = new Battlefield('Player', playerCanvas),
    opponentCanvas = document.getElementById('opponentCanvas')
    opponentBattlefield = new Battlefield('Opponent', opponentCanvas),
    templateCardImage = new Image(),
    btnCastDefile = document.getElementById('btn-cast-defile'),
    slidebar = document.getElementById('slidebar'),
    turnText = document.getElementById('turn-text'),
    spellDamageText = document.getElementById('spell-damage-text');

templateCardImage.src = "img/template.png";

let Snapshot = new class {
  constructor() {
    this.data = [];
  }

  takeSnapshot(_turn) {
    let snapshot = {
      turn: _turn,
      battlefields: { player: {}, opponent: {} },
    };

    copyBattlefield('player', playerBattlefield);
    copyBattlefield('opponent', opponentBattlefield);

    this.data.push(snapshot);

    // better solution?
    function copyBattlefield(target, source) {
      let battlefield = new Battlefield(source.name, source.canvas, false);

      battlefield.minions = [];
      for(let i = 0; i < source.minions.length; i++) {
        let sourceMinion = source.minions[i],
            newMinion = new Minion(
              sourceMinion.health,
              sourceMinion.divineShield,
              sourceMinion.spellDamage,
              sourceMinion.deathrattle
            );
        battlefield.minions.push(newMinion);
      }

      battlefield.boardSpellDamage = source.boardSpellDamage;
      battlefield.ctx = battlefield.canvas.getContext('2d');

      snapshot.battlefields[target] = battlefield;
    }
  }

  render(i) {
    let snapshot = Snapshot.data[i];

    turnText.textContent = slidebar.value;
    spellDamageText.textContent = snapshot.battlefields.player.boardSpellDamage;

    snapshot.battlefields.player.renderMinions();
    snapshot.battlefields.opponent.renderMinions();
  }
}


/* ========================================================================== */


function castDefile() {
  let keepCasting = false,
      timesOfCasting = 0;

  do {
    keepCasting = castDefileOnce();
  } while(keepCasting);

  turnText.textContent = Snapshot.data.length - 1;
  slidebar.max = Snapshot.data.length - 1;
  slidebar.value = Snapshot.data.length - 1;
  slidebar.disabled = false;

  function castDefileOnce() {
    let numOfMinionsDied = 0;

    timesOfCasting++;
    playerBattlefield.updateBoardSpellDamage();
    console.log(`\nCast defile (${timesOfCasting} times), boardSpellDamage: ${playerBattlefield.boardSpellDamage}`);

    playerBattlefield.dealDamagesToMinions(1 + playerBattlefield.boardSpellDamage);
    numOfMinionsDied += playerBattlefield.updateMinionsState();
    playerBattlefield.printMinions();

    opponentBattlefield.dealDamagesToMinions(1 + opponentBattlefield.boardSpellDamage);
    numOfMinionsDied += opponentBattlefield.updateMinionsState();
    opponentBattlefield.printMinions();

    console.log(`num of minions died this turn: ${numOfMinionsDied}`)

    Snapshot.takeSnapshot(timesOfCasting);

    return numOfMinionsDied;
  }
}


/* ========================================================================== */

window.onload = () => {
  playerBattlefield.generateTestingMinions(testingMinionNum.player);
  playerBattlefield.printMinions();

  opponentBattlefield.generateTestingMinions(testingMinionNum.opponent);
  opponentBattlefield.printMinions();

  playerBattlefield.updateBoardSpellDamage();
  spellDamageText.textContent = playerBattlefield.boardSpellDamage;
  Snapshot.takeSnapshot(0);

  btnCastDefile.onclick = castDefile;
  slidebar.oninput = () => {
    Snapshot.render(slidebar.value);
  };
};