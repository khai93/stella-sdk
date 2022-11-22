import { StellaClient } from "../src";
import sleep from "../src/utils/sleep";

const client = new StellaClient();

(async function() {
    const batch = await client.createBatch({
        source_code: `
        function twoSum(nums, target) {
            for (let i = 0; i < nums.length; i++) {
              for (let j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] === target) {
                  return [i, j];
                }
              }
            }
          }
        process.stdin.on('data', v => {
            console.log(fib(parseInt(v.toString())));process.exit()})`,
        language_id: 2,
        inputs: ['3', '634', '8', '3', '634', '8', '3', '634', '8', '3', '634', '8'],
        expected_outputs: ['2', '6', '6', '3', '634', '8', '3', '634', '8']
    });

    await sleep(6000);

    console.log(await client.checkBatch(batch.submissions));
})()