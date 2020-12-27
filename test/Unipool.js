const { BN, time } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const assert = require('assert');

const Uni = artifacts.require('UniMock');
const Coin = artifacts.require('CoinMock');
const Cred = artifacts.require('Cred');
const Unipool = artifacts.require('Unipool');

let distributionAmount = 10000;
let credMultiplier = 100;
const getDistributionAmount = () => distributionAmount;
const ratio = () => getDistributionAmount()/72000 * 7/30;
const convertToExpected = (input) => String(Math.floor(parseInt(input, 10) * ratio()));

async function timeIncreaseTo (seconds) {
    const delay = 10 - new Date().getMilliseconds();
    await new Promise(resolve => setTimeout(resolve, delay));
    await time.increaseTo(seconds);
}

const almostEqualDiv1e18 = function (expectedOrig, actualOrig) {
    const _1e18 = new BN('10').pow(new BN('18'));
    const expected = expectedOrig.div(_1e18);
    const actual = actualOrig.div(_1e18);
    this.assert(
        expected.eq(actual) ||
        expected.addn(1).eq(actual) || expected.addn(2).eq(actual) ||
        actual.addn(1).eq(expected) || actual.addn(2).eq(expected),
        'expected #{act} to be almost equal #{exp}',
        'expected #{act} to be different from #{exp}',
        expectedOrig.toString(),
        actualOrig.toString(),
    );
};

require('chai').use(function (chai, utils) {
    chai.Assertion.overwriteMethod('almostEqualDiv1e18', function (original) {
        return function (value) {
            if (utils.flag(this, 'bignumber')) {
                var expected = new BN(value);
                var actual = new BN(this._obj);
                almostEqualDiv1e18.apply(this, [expected, actual]);
            } else {
                original.apply(this, arguments);
            }
        };
    });
});

contract('Unipool', function ([_, wallet1, wallet2, wallet3, wallet4]) {
    describe('Unipool', async function () {
        beforeEach(async function () {
            credMultiplier = 100;

            this.uni = await Uni.new();
            this.coin = await Coin.new();
            this.cred = await Cred.new();
            this.pool = await Unipool.new(this.uni.address, this.coin.address, this.cred.address);

            await this.pool.setRewardDistribution(wallet1);

            await this.coin.mint(this.pool.address, web3.utils.toWei('10000'));
            await this.cred.mint(this.pool.address, web3.utils.toWei('1000000'));
            await this.uni.mint(wallet1, web3.utils.toWei('1000'));
            await this.uni.mint(wallet2, web3.utils.toWei('1000'));
            await this.uni.mint(wallet3, web3.utils.toWei('1000'));
            await this.uni.mint(wallet4, web3.utils.toWei('1000'));

            await this.uni.approve(this.pool.address, new BN(2).pow(new BN(255)), { from: wallet1 });
            await this.uni.approve(this.pool.address, new BN(2).pow(new BN(255)), { from: wallet2 });
            await this.uni.approve(this.pool.address, new BN(2).pow(new BN(255)), { from: wallet3 });
            await this.uni.approve(this.pool.address, new BN(2).pow(new BN(255)), { from: wallet4 });

            this.started = (await time.latest()).addn(10);
            await timeIncreaseTo(this.started);
        });

        it('Verify Cred details', async function () {
            expect(await this.cred.name()).to.be.a('string', 'Street Cred');
            expect(await this.cred.symbol()).to.be.a('string', 'CRED');
        });

        it('Security checks', async function () {
            // Disallow non-approved account from setting cred multiplier
            try { await this.pool.setCredMultiplier(credMultiplier); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
            try { await this.pool.setCredMultiplier(credMultiplier, { from: wallet2 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
            try { await this.pool.setCredMultiplier(credMultiplier, { from: wallet3 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
            try { await this.pool.setCredMultiplier(credMultiplier, { from: wallet4 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }

            // Disallow non-approved account from setting new reward duration
            try { await this.pool.setPeriodDuration(1209600); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
            try { await this.pool.setPeriodDuration(1209600, { from: wallet2 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
            try { await this.pool.setPeriodDuration(1209600, { from: wallet3 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
            try { await this.pool.setPeriodDuration(1209600, { from: wallet4 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Caller is not reward distribution') !== -1); }
        });

        it('Two stakers with the same stakes wait 1 w', async function () {
            // 2500 Coin per week for 3 weeks
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18('0');
            expect(await this.pool.earned(wallet1)).to.be.bignumber.equal('0');
            expect(await this.pool.earned(wallet2)).to.be.bignumber.equal('0');

            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });
            await this.pool.stake(web3.utils.toWei('1'), { from: wallet2 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18('0');
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18('0');
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18('0');

            await timeIncreaseTo(this.started.add(time.duration.weeks(1)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('36000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('36000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('36000')));

            expect(await this.pool.cred_rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('3600000')));
            expect(await this.pool.cred_earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('3600000')));
            expect(await this.pool.cred_earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('3600000')));
        });

        it('Two stakers with the different (1:3) stakes wait 1 w', async function () {
            // 2500 Coin per week
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18('0');
            expect(await this.pool.balanceOf(wallet1)).to.be.bignumber.equal('0');
            expect(await this.pool.balanceOf(wallet2)).to.be.bignumber.equal('0');
            expect(await this.pool.earned(wallet1)).to.be.bignumber.equal('0');
            expect(await this.pool.earned(wallet2)).to.be.bignumber.equal('0');

            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });
            await this.pool.stake(web3.utils.toWei('3'), { from: wallet2 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18('0');
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18('0');
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18('0');

            await timeIncreaseTo(this.started.add(time.duration.weeks(1)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('18000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('18000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('54000')));

            expect(await this.pool.cred_rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('1800000')));
            expect(await this.pool.cred_earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('1800000')));
            expect(await this.pool.cred_earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('5400000')));
        });

        it('Two stakers with the different (1:3) stakes wait 2 weeks, then finally 30 days', async function () {
            //
            // 1x: +----------------+ = 72k for 1w + 18k for 2w
            // 3x:         +--------+ =  0k for 1w + 54k for 2w
            //

            // 2500 Coin per week
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });
            
            await timeIncreaseTo(this.started.add(time.duration.weeks(1)));

            await this.pool.stake(web3.utils.toWei('3'), { from: wallet2 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('72000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('72000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            expect(await this.pool.cred_rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('7200000')));
            expect(await this.pool.cred_earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('7200000')));
            expect(await this.pool.cred_earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            // Forward to week 3
            await timeIncreaseTo(this.started.add(time.duration.weeks(3)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('108000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('108000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('108000')));

            expect(await this.pool.cred_rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('10800000')));
            expect(await this.pool.cred_earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('10800000')));
            expect(await this.pool.cred_earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('10800000')));

            // Forward to week 3
            await timeIncreaseTo(this.started.add(time.duration.days(30)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('131154')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('131154')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('177429')));

            expect(await this.pool.cred_rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('13114333')));
            expect(await this.pool.cred_earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('13114333')));
            expect(await this.pool.cred_earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('17742900')));
        });

        it('Three stakers with the different (1:3:5) stakes wait 3 weeks, then finally 30 days', async function () {
            //
            // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
            // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
            // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
            //

            // Change cred multiplier
            credMultiplier = 80;
            await this.pool.setCredMultiplier(credMultiplier, { from: wallet1 });

            // 2500 Coin per week for 3 weeks
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });
            await this.pool.stake(web3.utils.toWei('3'), { from: wallet2 });
            
            await timeIncreaseTo(this.started.add(time.duration.weeks(1)));

            await this.pool.stake(web3.utils.toWei('5'), { from: wallet3 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('18000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('18000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('54000')));

            await timeIncreaseTo(this.started.add(time.duration.weeks(2)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('26000'))); // 18k + 8k
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('26000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('78000')));
            expect(await this.pool.earned(wallet3)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('40000')));

            await this.pool.exit({ from: wallet2 });

            await timeIncreaseTo(this.started.add(time.duration.weeks(3)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('38000'))); // 18k + 8k + 12k
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('38000')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));
            expect(await this.pool.earned(wallet3)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('100000')));

            await timeIncreaseTo(this.started.add(time.duration.days(30)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('53450'))); // 18k + 8k + 12k
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('53450')));
            expect(await this.pool.earned(wallet2)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));
            expect(await this.pool.earned(wallet3)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('177154')));
        });

        it('One staker on 2 durations with gap, then finally 30 days', async function () {
            // Change cred multiplier
            credMultiplier = 30;
            await this.pool.setCredMultiplier(credMultiplier, { from: wallet1 });

            // 2500 Coin per week for 1 weeks
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });

            await timeIncreaseTo(this.started.add(time.duration.weeks(2)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('144000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('144000')));

            await timeIncreaseTo(this.started.add(time.duration.weeks(3)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('216000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('216000')));

            await timeIncreaseTo(this.started.add(time.duration.days(30)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            await this.pool.getReward({ from: wallet1 });

            expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount)));
            expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount*credMultiplier)));

        });

        it('Stake before goes live, get expected payout after time, then wait for next pool, start again', async function () {
            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });

            await timeIncreaseTo(this.started.add(time.duration.weeks(1)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            // 2500 Coin per week
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            await timeIncreaseTo(this.started.add(time.duration.weeks(2)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('72000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('72000')));

            await timeIncreaseTo(this.started.add(time.duration.days(37)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            await timeIncreaseTo(this.started.add(time.duration.weeks(6)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            // Collect
            await this.pool.getReward({ from: wallet1 });

            expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount)));
            expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount*credMultiplier)));


            // Get previous cred amount
            let prevCredAmount = distributionAmount*credMultiplier;

            // Change cred multiplier
            credMultiplier = 10;
            await this.pool.setCredMultiplier(credMultiplier, { from: wallet1 });

            // Add more coin & cred
            await this.coin.mint(this.pool.address, web3.utils.toWei('10000'));
            await this.cred.mint(this.pool.address, web3.utils.toWei(String(10000 * credMultiplier)));


            // Go again
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 7)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('380578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('72000')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 30)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('617156')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            // Collect again
            await this.pool.getReward({ from: wallet1 });

            // This should change, we added more coin and cred
            expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount*2)));
            expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(prevCredAmount + 10000*credMultiplier)));


            // Get previous cred amount
            prevCredAmount += 10000*credMultiplier;

            // Change cred multiplier
            credMultiplier = 25;
            await this.pool.setCredMultiplier(credMultiplier, { from: wallet1 });

            // again, this time fill in both and reduce both amounts by a factor of 10, and reduce cred multiplier from 100 to 10
            await this.coin.mint(this.pool.address, web3.utils.toWei('1000'));
            await this.cred.mint(this.pool.address, web3.utils.toWei(String(1000 * credMultiplier)));


            // Go again
            await this.pool.notifyRewardAmount(web3.utils.toWei('1000'), { from: wallet1 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('617156')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 30 + 7)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('624356')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('7200')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 30 + 30)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('648013')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('30857')));

            // Collect again, exit
            expect(await this.uni.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String('999')));
            await this.pool.exit({ from: wallet1 });

            // This should change, we added more coin
            expect(await this.uni.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String('1000')));
            expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(10000*2 + 1000)));
            expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(prevCredAmount + 1000*credMultiplier)));

        });


        it('Test duration change: stake before goes live, get expected payout after time, then wait for next pool, start again', async function () {
            await this.pool.stake(web3.utils.toWei('1'), { from: wallet1 });

            await timeIncreaseTo(this.started.add(time.duration.weeks(1)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            // Set different duration
            await this.pool.setPeriodDuration(time.duration.days(15), { from: wallet1 });

            // 2500 Coin per week
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            await timeIncreaseTo(this.started.add(time.duration.weeks(2)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('144000')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('144000')));

            // Sec check, disallow period change
            try { await this.pool.setPeriodDuration(5, { from: wallet1 }); assert(false); }
            catch(ex) { assert(String(ex).indexOf('Period is not yet over') !== -1); }

            await timeIncreaseTo(this.started.add(time.duration.days(27)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            await timeIncreaseTo(this.started.add(time.duration.weeks(6)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            // Collect -- DON'T claim, instead make sure the numbers still end up the same at the end
            //await this.pool.getReward({ from: wallet1 });

            //expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount)));
            //expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount*credMultiplier)));

            // Set different duration
            await this.pool.setPeriodDuration(time.duration.days(90), { from: wallet1 });


            // Get previous cred amount
            let prevCredAmount = distributionAmount*credMultiplier;

            // Change cred multiplier
            credMultiplier = 5;
            await this.pool.setCredMultiplier(credMultiplier, { from: wallet1 });

            // Add more coin and cred
            await this.coin.mint(this.pool.address, web3.utils.toWei('10000'));
            await this.cred.mint(this.pool.address, web3.utils.toWei(String(10000 * credMultiplier)));


            // Go again
            await this.pool.notifyRewardAmount(web3.utils.toWei(String(distributionAmount)), { from: wallet1 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('308578')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 7 * 3)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('380578')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected(String(308578 + 72000))));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 90 * 3)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('617156')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected(String(308578 * 2))));

            // Collect again
            await this.pool.getReward({ from: wallet1 });

            // This should change, we added more coin & cred
            expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(distributionAmount*2)));
            expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(prevCredAmount + 10000*credMultiplier)));


            // Set different duration
            await this.pool.setPeriodDuration(time.duration.days(30), { from: wallet1 });

            // Get previous cred amount
            prevCredAmount += 10000*credMultiplier;

            // Change cred multiplier
            credMultiplier = 12;
            await this.pool.setCredMultiplier(credMultiplier, { from: wallet1 });

            // again, this time fill in both and reduce both amounts by a factor of 10, and reduce cred multiplier from 100 to 10
            await this.coin.mint(this.pool.address, web3.utils.toWei('1000'));
            await this.cred.mint(this.pool.address, web3.utils.toWei(String(1000 * credMultiplier)));


            // Go again
            await this.pool.notifyRewardAmount(web3.utils.toWei('1000'), { from: wallet1 });

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('617156')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('0')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 90 * 3 + 7)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('624356')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('7200')));

            await timeIncreaseTo(this.started.add(time.duration.days(42 + 90 * 3 + 30)));

            expect(await this.pool.rewardPerToken()).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('648013')));
            expect(await this.pool.earned(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(convertToExpected('30857')));

            // Collect again, exit
            expect(await this.uni.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String('999')));
            await this.pool.exit({ from: wallet1 });

            // This should change, we added more coin
            expect(await this.uni.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String('1000')));
            expect(await this.coin.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(10000*2 + 1000)));
            expect(await this.cred.balanceOf(wallet1)).to.be.bignumber.almostEqualDiv1e18(web3.utils.toWei(String(prevCredAmount + 1000*credMultiplier)));

        });
    });
});
