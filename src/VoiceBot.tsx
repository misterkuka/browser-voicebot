import type { AutomaticSpeechRecognitionPipeline, Text2TextGenerationPipeline, TextToAudioPipeline } from '@huggingface/transformers';
import { Alert, Spin } from 'antd';
import hark from 'hark';
import { useEffect, useRef, useState } from "react";



export default function VoiceBot(props: {
    stt?: AutomaticSpeechRecognitionPipeline,
    tts?: TextToAudioPipeline,
    gpt2?: Text2TextGenerationPipeline
}) {
    const [audio, setAudio] = useState<Blob | undefined>()
    const [audioURL, setAudioURL] = useState<string>()
    const audioRef = useRef<HTMLAudioElement>(null)
    const [device, setDevice] = useState<MediaStream>()
    const [log, setLog] = useState<string>("Start speaking")
    const [loading, setLoading] = useState<boolean>(false)

    const [transcription, setTranscription] = useState<string>("")
    const [response, setResponse] = useState<string>("")
    // const setLog = (l: string) => logs(prev => [...prev ?? [], l])
    // useEffect(() => {
    //     connect().then(c => register(c).then(() => setRegistered(true)))
    // }, [])

    useEffect(() => {
        if (device) return
        window.navigator.mediaDevices.getUserMedia({
            audio: true
        }).then(setDevice)

    }, [device])

    useEffect(() => {
        if (!device) return
        const stream = device
        var options = {};
        var speechEvents = hark(stream, options);
        const mimeType = 'audio/wav';
        const mediaRecorder = new MediaRecorder(stream);
        let audioChunks: BlobEvent['data'][] = []
        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        speechEvents.on("speaking", function () {
            audioChunks = []
            mediaRecorder.start();
            console.log('speaking');
            setLog("Human is speaking")
        });
        speechEvents.on('stopped_speaking', async function () {
            mediaRecorder.stop()
            await new Promise(res => setTimeout(() => { res("") }, 100))
            console.log('stopped_speaking');
            setLog("Human stopped speaking")
            const audioBlob = new Blob(audioChunks, {
                type: mimeType
            });
            setAudio(audioBlob)
            setDevice(undefined)
        });

        return () => {
            mediaRecorder.removeEventListener('dataavailable', () => { });
            mediaRecorder.removeEventListener('stop', () => { });
            speechEvents.stop();
            if (audioURL) URL.revokeObjectURL(audioURL);
        };

    }, [device])



    useEffect(() => {
        if (!audio) return
        // translate().catch(console.error)
        const u = URL.createObjectURL(audio)
        console.log(u)
        setAudioURL(u)
        const process = async () => {
            setLoading(true)
            setTranscription("")
            setResponse("")
            setLog("Processing Transcription")
            const res = await props.stt?.(u) as { text: string }
            console.log('transcription', res)
            setTranscription(res.text)
            setLog('Transcription Done. Generating Response')
            const response = await props.gpt2?.(res.text, { max_new_tokens: 50 }) as { generated_text: string }[]
            console.log('response', response)
            setResponse(response[0]?.generated_text)
            setLog('Response Generated. Generating Audio')
            const audio = await props.tts?.(response[0]?.generated_text, { speaker_embeddings: 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin' })
            if (audio) {
                setLog('Audio Generated, Playing... ')
                const buffer = encodeWAV(audio?.audio)
                const blob = new Blob([buffer], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob)
                if (audioRef.current) {
                    audioRef.current.src = url
                    audioRef.current.load()
                    audioRef.current.play().then(async () => {
                        await new Promise(res => setTimeout(() => { res("") }, 1000))
                        setLog('Waiting for human to speak...')
                    })
                }

            }
            setLoading(false)
        }
        process()
        // if (!audioRef.current) return
        // audioRef.current.src = u
        // audioRef.current.load()

    }, [audio])
    return (
        <div className='flex flex-col gap-2'>

            <Alert message={log} type="info" showIcon icon={loading ? <Spin size='small' spinning /> : undefined} />
            <audio className='w-full' ref={audioRef} controls></audio>
            <div className='flex flex-col mt-2 text-[14px]'>
                {transcription && <> <b>Transcription:</b>
                    {transcription}</>}
                {response && <>
                    <b>Response:</b>
                    {response}
                </>}
            </div>
            {/* <ReactMediaRecorder audio render={({ startRecording, stopRecording, mediaBlobUrl }) => (
                <div>
                    <button onClick={startRecording}>Start Recording</button>
                    <button onClick={stopRecording}>Stop Recording</button>
                    <audio controls src={mediaBlobUrl} />
                </div>
            )}></ReactMediaRecorder> */}
        </div>
    );
}

export function encodeWAV(samples: Float32Array) {
    let offset = 44;
    const buffer = new ArrayBuffer(offset + samples.length * 4);
    const view = new DataView(buffer);
    const sampleRate = 16000;

    /* RIFF identifier */
    writeString(view, 0, 'RIFF')
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 4, true)
    /* RIFF type */
    writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, 3, true)
    /* channel count */
    view.setUint16(22, 1, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 4, true)
    /* bits per sample */
    view.setUint16(34, 32, true)
    /* data chunk identifier */
    writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * 4, true)

    for (let i = 0; i < samples.length; ++i, offset += 4) {
        view.setFloat32(offset, samples[i], true)
    }

    return buffer
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; ++i) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}