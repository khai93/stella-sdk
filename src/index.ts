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

export type Langauge = {
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


    // Gets a submission by it's token
    async getSubmission(token: string): Promise<SubmissionOutput> {
        const resp = await this.#axiosInstance.get("/v1/submissions/" + token);
        return resp.data;
    }

    // Fetches a list of languages installed in current running stella
    async getLanguages(): Promise<Langauge[]> {
        const resp = await this.#axiosInstance.get("/v1/languages");
        return resp.data;
    }
}