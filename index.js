/**
 * http://www.fryes4fun.com/Bowling/scoring.htm
 *
 * high level overview:
 * one player per traditional round
 * each frame is mostly the same
 * 10 frame total
 * final frame may have 2-3 throws
 *
 * score for turn can be dependent on the next two throws
 * (i.e. strike or spare)
 */

class Frame {
    // an open frame is any frame in which all ten pins are not knocked down
    open
    strike
    spare
    pinsKnockedDown
    throws

    constructor(open, strike, spare, pinsKnockedDown, throws) {
        this.open = open || false;
        this.strike = strike || false;
        this.spare = spare || false;
        this.pinsKnockedDown = pinsKnockedDown || 0;
        this.throws = throws || [0, 0, 0];
    }
}

const STRIKE = 10;

class Bowling {
    /** for keeping track of score state, what kinds of throws happened throughout game, etc. */
    scorecard
    currentThrow
    currentFrame
    /** for overall score representation, i.e. the cumulative results from data tracked on the scorecard */
    score

    constructor(score = 0, currentFrame = 0, currentThrow = 1) {
        this.score = score;
        this.currentFrame = currentFrame;
        this.currentThrow = currentThrow;

        this.scorecard = []

        for (let i = 0; i < 10; i++) {
            this.scorecard.push(new Frame());
        }

        return this;
    }

    /** semantic helpers for applying conditional logic based on proximity to endgame */
    isFinalFrame() {
        return this.currentFrame === 9;
    }

    isNotFinalFrame() {
        return this.currentFrame !== 9;
    }

    /** getters and setters for managing Frame class */
    setThrowResult(result) {
        this.scorecard[this.currentFrame].throws[this.currentThrow - 1] = result;
    }

    setPinsKnockedDown(pinsKnockedDown) {
        this.scorecard[this.currentFrame].pinsKnockedDown = pinsKnockedDown;
    }

    getPinsKnockedDown() {
        return this.scorecard[this.currentFrame].pinsKnockedDown;
    }

    /**
     * attempt to knock down pins until the rules dictate that we can't any more
     * at this point, we break from the function
     *
     * @returns true when the frame is over, false when the frame is not over
     */
    throwTheBall() {
        const remainingPins = 10 - this.scorecard[this.currentFrame].pinsKnockedDown;

        // we still base our result on 10 total possible, and use the maximum possible value in the case of
        // "knocking down pins that aren't there"
        // otherwise our RNG is too strict and it's highly improbable that we ever throw strikes or spares
        const throwResult = Math.min(Math.floor(Math.random() * 11), remainingPins);

        // record the throw result in the corresponding throw record in the scorecard
        this.setThrowResult(throwResult);

        if (throwResult === STRIKE) {
            this.scorecard[this.currentFrame].strike = true;
            this.setPinsKnockedDown(STRIKE);

            // unless it is the final turn of the game, rolling a strike will end this turn
            if (this.isNotFinalFrame()) {
                return true;
            }

            // in the final turn of the game, rolling a strike on the first turn awards you two additional throws
            if (this.currentThrow < 3) {
                this.currentThrow += 1;
                return false;
            }

            return true;
        /** spare case (not the first throw AND all the pins are knocked down) */
        } else if (throwResult === remainingPins) {
            this.scorecard[this.currentFrame].spare = true;
            this.setPinsKnockedDown(STRIKE);

            if (this.isNotFinalFrame()) {
                return true;
            }

            // in the final turn of the game, rolling a strike on the first turn awards you two additional throws
            if (this.currentThrow < 3) {
                this.currentThrow += 1;
                return false;
            }

            return true;
        } else {
            /** add the number of pins knocked down to your total pins knocked down for this roll */
            this.setPinsKnockedDown(this.getPinsKnockedDown() + throwResult);
            let frameIsOver = false;

            if (this.isNotFinalFrame()) {
                frameIsOver = this.currentThrow >= 2;

                if (frameIsOver) return true;

                this.currentThrow += 1;
                return false;
            }

            frameIsOver = this.currentThrow >= 3;

            if (frameIsOver) return true;

            this.currentThrow += 1;
            return false;
        }
    }

    /** throw the ball until the criteria for completing a frame have been met */
    completeFrame() {
        let frameComplete = this.throwTheBall();

        while (!frameComplete) {
            frameComplete = this.throwTheBall();
        }

        if (this.getPinsKnockedDown() !== STRIKE) {
            this.scorecard[this.currentFrame].open = true;
        }

        this.currentFrame += 1;
        this.currentThrow = 1;
    }

    /**
     * strikes and spares have a scoring function that is relative to the throws that happen after the
     * strike or spare. from the above link:
     *
     * - A strike earns 10 points plus the sum of your next two shots
     * - A spare earns 10 points plus the sum of your next one shot
     */
    calculateScore() {
        let i = 0;
        console.log("SCORING:")

        while (i < 9) {
            let scoringExplanation = `Frame ${i + 1}: ${this.scorecard[i].pinsKnockedDown}`;
            if (i === 0) {
                this.score += this.scorecard[i].pinsKnockedDown;
            } else if (this.scorecard[i - 1].strike) {
                // add the strike value with the sum of the points for the next two throws
                scoringExplanation += ` PLUS strike on frame ${i} results in additional ${this.scorecard[i].throws[0]} + ${this.scorecard[i].throws[1]} from next two throws`
                this.score += this.scorecard[i].pinsKnockedDown + this.scorecard[i].throws[0] + this.scorecard[i].throws[1];
            } else if (this.scorecard[i - 1].spare) {
                // add the value of the first throw to your score for this frame
                scoringExplanation += ` PLUS spare on frame ${i} results in additional ${this.scorecard[i].throws[0]} from next throw`
                this.score += this.scorecard[i].pinsKnockedDown + this.scorecard[i].throws[0];
            } else {
                this.score += this.scorecard[i].pinsKnockedDown;
            }

            console.log(scoringExplanation);
            i++;
        }
    }

    /** "main" method that executes the component methods in the correct order */
    play() {
        console.log("\n")
        console.log("COMPLETELY ACCURATE BOWLING SIMULATOR")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log("\n")

        while (true) {
            if (this.currentFrame === 10) break;
            this.completeFrame();
        }

        this.calculateScore();

        // logging for scoring details
        console.log(`\nYour score was: ${this.score}`);
        console.log("Scorecard:\n");

        this.scorecard.forEach(frame => {
            console.log(`${frame.throws} ${frame.strike ? "(strike)" : frame.spare ? "(spare)" : ""}`);
        })
    }
}

new Bowling().play();
