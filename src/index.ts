import axios, { AxiosInstance } from "axios"
import sleep from "./utils/sleep"

export type SubmissionInput = {
    token?: string,
    source_code: string,
    language_id: number,
    additional_files?: string,
    expected_output?: string,
    std_in?: string
}

export type SubmissionBatchInput = {
    source_code: string,
    language_id: number,
    additional_files?: string,
    inputs: string[],
    expected_outputs: string[]
}

export type SubmissionBatchOutput = {
    // A boolean representing if all linked submissions have finished executing
    executed: boolean,
    // The average time taken for all submissions
    average_time: number,
    // If all outputs matched its expected outputs
    outputs_matched: boolean,
    // An array of all related submissions for the batch
    submissions: SubmissionOutput[]
}

export type SubmissionOutput = {
    stdout?: string,
    stderr?: string,
    exit_code: number,
    token: string,
    memory?: number,
    executed: boolean,
    output_matched?: boolean,
    time: number
}

export type Language = {
    id: number,
    version: string,
    name: string
}

export class StellaClient {
    #axiosInstance: AxiosInstance
    constructor(stellaUrl?: string) {
        if (stellaUrl === undefined) {
            // default development host
            stellaUrl = "http://localhost:4000"
        }
        this.#axiosInstance = axios.create({
            baseURL: stellaUrl,
            timeout: 10000
          });
    }

    // Creates a submission without watiting for the submission to be executed
    async createSubmission(input: SubmissionInput): Promise<SubmissionOutput> {
        const resp = await this.#axiosInstance.post("/v1/submissions/create", input);
        return resp.data;
    }

    // Creates a submission and waits until the submission has been executed by stella
    async executeSubmission(input: SubmissionInput): Promise<SubmissionOutput> {
        const resp = await this.createSubmission(input);

        // If it has not been executed and
        // the submission isn't timed out
        // Call the function recursively
        if (!resp.executed && resp.exit_code != 124) {
            await sleep(500);
            return this.executeSubmission(input);
        }

        return resp;
    }

    async createBatch(batchInput: SubmissionBatchInput): Promise<SubmissionBatchOutput> {
        const output: SubmissionBatchOutput = {
            executed: false,
            average_time: 0,
            outputs_matched: false,
            submissions: []
        }

        for (let i = 0; i < batchInput.inputs.length;i++) {
            const submission: SubmissionInput = {
                source_code: batchInput.source_code,
                language_id: batchInput.language_id,
                std_in: batchInput.inputs[i],
                expected_output: batchInput.expected_outputs[i]
            }

            output.submissions.push(
                await this.createSubmission(submission)
            )
        }

        return output;
    }

    // Checks an array of submissions as a submission batch
    async checkBatch(submissions: SubmissionOutput[]): Promise<SubmissionBatchOutput> {
        const batchOutput: SubmissionBatchOutput = {
            executed: true,
            average_time: 0,
            outputs_matched: true,
            submissions: []
        }

        // The sum of all submissions time used for getting the average
        let submissionsTimeSum = 0;
        for (let i = 0;i < submissions.length;i++) {
            if (typeof submissions[i].token !== 'string') 
                continue;

            const submission = await this.getSubmission(submissions[i].token as string);
            batchOutput.submissions.push(submission);
            
            // if any of the submissions haven't executed then the batch is not done executing
            if (submission.executed === false) {
                batchOutput.executed = false;
            }

            // if a submission is executed and the output did not match then the entire batch does not match
            if (submission.executed && submission.output_matched) {
                batchOutput.outputs_matched = false;
            }

            submissionsTimeSum += parseInt(submission.time as unknown as string);
        }

        batchOutput.average_time = submissionsTimeSum / batchOutput.submissions.length;

        return batchOutput;
    }


    // Gets a submission by it's token
    async getSubmission(token: string): Promise<SubmissionOutput> {
        const resp = await this.#axiosInstance.get("/v1/submissions/" + token);
        return resp.data;
    }

    // Fetches a list of languages installed in current running stella
    async getLanguages(): Promise<Language []> {
        const resp = await this.#axiosInstance.get("/v1/languages");
        return resp.data;
    }
}