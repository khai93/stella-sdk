import axios, { AxiosInstance } from "axios"

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

    async createSubmission(input: SubmissionInput): Promise<SubmissionOutput> {
        const resp = await this.#axiosInstance.post("/v1/submissions/create", input);
        return resp.data;
    }

    async getSubmission(token: string): Promise<SubmissionOutput> {
        const resp = await this.#axiosInstance.get("/v1/submissions/" + token);
        return resp.data;
    }

    async getLanguages(): Promise<Langauge[]> {
        const resp = await this.#axiosInstance.get("/v1/languages");
        return resp.data;
    }
}