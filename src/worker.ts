import { AutomaticSpeechRecognitionPipeline, pipeline, Text2TextGenerationPipeline, TextToAudioPipeline, type ProgressCallback } from '@huggingface/transformers';
class Processor {
    static ttsInstance: TextToAudioPipeline | null = null;
    static sttInstance: AutomaticSpeechRecognitionPipeline | null = null
    static gpt2Instance: Text2TextGenerationPipeline | null = null

    static async getTTSInstance(progress_callback: ProgressCallback) {
        // @ts-ignore
        if (!this.ttsInstance) this.ttsInstance = await pipeline('text-to-speech', 'Xenova/speecht5_tts', { progress_callback }) as TextToAudioPipeline;
        const speaker_embeddings = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';

        return {
            processor: async (text: string) => (this.ttsInstance as TextToAudioPipeline)(text, { speaker_embeddings }),
            instance: this.ttsInstance
        }
    }

    static async getSTTInstance(progress_callback: ProgressCallback) {
        if (!this.sttInstance) this.sttInstance = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', { progress_callback }) as AutomaticSpeechRecognitionPipeline;
        return this.sttInstance
    }

    static async getGPT2Instance(progress_callback: ProgressCallback) {
        if (!this.gpt2Instance) this.gpt2Instance = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M', { progress_callback }) as Text2TextGenerationPipeline;
        return this.gpt2Instance
    }
}

self.addEventListener('message', async event => {
    const data = event.data;
    console.log(data);
    const tts = await Processor.getTTSInstance(x => {
        postMessage({
            type: 'tts-progress',
            data: x
        })
    })
    const stt = await Processor.getSTTInstance(x => {
        postMessage({
            type: 'stt-progress',
            data: x
        })
    })
    const gpt2 = await Processor.getGPT2Instance(x => {
        postMessage({
            type: 'gpt2-progress',
            data: x
        })
    })

    if (data.type === 'respond') {
        const result = await gpt2(data.text, {
            max_length: 100
        })
        postMessage({
            type: 'respond',
            data: result
        })
    }

    if (data.type === 'tts') {
        const result = await tts.processor(data.text)
        postMessage({
            type: 'tts',
            data: result
        })
    }

    if (data.type === 'stt') {
        const audio = data.audio

        const result = await stt(audio)
        postMessage({
            type: 'stt',
            data: result
        })
    }
})
