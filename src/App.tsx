import { AutomaticSpeechRecognitionPipeline, pipeline, Text2TextGenerationPipeline, TextToAudioPipeline } from '@huggingface/transformers';
import { Alert, Progress, Spin } from 'antd';
import Markdown from 'markdown-to-jsx';
import { useEffect, useState } from 'react';
import VoiceBot from './VoiceBot';

function App() {

  // const worker = useRef<Worker>(null);

  const [ttsInstance, setTTSInstance] = useState<{
    instance?: TextToAudioPipeline | null,
    progress?: {
      file: string,
      progress: number,
      name: string
    }[] | null,
    done?: boolean
  } | null>(null);

  const [sttInstance, setSTTInstance] = useState<{
    instance?: AutomaticSpeechRecognitionPipeline | null,
    progress?: {
      file: string,
      progress: number,
      name: string
    }[] | null,
    done?: boolean
  } | null>(null);

  const [gpt2Instance, setGPT2Instance] = useState<{
    instance?: Text2TextGenerationPipeline | null,
    progress?: {
      file: string,
      progress: number,
      name: string
    }[] | null,
    done?: boolean
  } | null>(null);


  useEffect(() => {
    pipeline('text-to-speech', 'Xenova/speecht5_tts', {
      progress_callback: (x) => {
        setTTSInstance(prev => {
          return {
            instance: prev?.instance ?? null,
            // @ts-ignore
            progress: x.status === "progress" ? [x, ...prev?.progress?.filter(i => i.file != x.file) ?? []] : prev?.progress
          }
        })
      }
    }).then(i => setTTSInstance(prev => {
      console.log("done")
      return {
        instance: i,
        done: true,
        progress: prev?.progress
      }
    }))

    pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: (x) => {
        setSTTInstance(prev => {
          return {
            instance: prev?.instance ?? null,
            // @ts-ignore
            progress: x.status === "progress" ? [x, ...prev?.progress?.filter(i => i.file != x.file) ?? []] : prev?.progress
          }
        })
      }
    }).then(i => setSTTInstance(prev => {

      return {
        instance: i,
        done: true,
        progress: prev?.progress
      }
    }))

    pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M', {
      progress_callback: (x) => {
        setGPT2Instance(prev => {
          return {
            instance: prev?.instance ?? null,
            // @ts-ignore
            progress: x.status === "progress" ? [x, ...prev?.progress?.filter(i => i.file != x.file) ?? []] : prev?.progress
          }
        })
      }
    }).then(i => setGPT2Instance(prev => {
      console.log("done")
      return {
        instance: i,
        done: true,
        progress: prev?.progress
      }
    }))
  }, [])

  useEffect(() => {
    console.log('TTS Instance:', ttsInstance);
  }, [ttsInstance])


  return (
    <>
      <div className='flex flex-col items-center justify-center h-[100vh]'>
        <div className='w-full bg-blue-100 p-4 shadow-md'>
          <div className='text-xl font-bold text-blue-600'>Browser Voicebot Demo</div>
        </div>
        {/* CONTENT */}
        <div className='flex-1 p-6 overflow-y-auto flex flex-row  w-full flex-wrap items-start justify-start'>
          <div className='md:w-1/2 w-full p-4 flex flex-col gap-4 items-start md:h-[calc(100vh-200px)] overflow-y-auto'>

            <div className='mb-6 w-full'>
              {!ttsInstance?.done || !sttInstance?.done || !gpt2Instance?.done ?
                // <Button block disabled loading>Loading models</Button> 
                <Alert type='info' message='Loading models' icon={<Spin spinning size='small' style={{ marginRight: '8px' }} />} showIcon />
                :
                // <audio className='w-full' ref={null} controls></audio>
                <VoiceBot stt={sttInstance?.instance || undefined}
                  gpt2={gpt2Instance?.instance || undefined}
                  tts={ttsInstance?.instance || undefined}
                />
                // <></>
              }
            </div>

            <div className='font-semibold p-4 bg-gray-100 w-full rounded-md'>Speech to Text models</div>
            {
              ttsInstance?.progress?.map(item => <div className='w-full'>
                <div key={item.file + item.name}><b>{item.name}</b> {item.file}</div>
                <Progress key={item.file} percent={parseFloat(item.progress?.toFixed(2))} /></div>)
            }
            <div className='font-semibold p-4 bg-gray-100 w-full rounded-md'>Text to Speech models</div>
            {
              sttInstance?.progress?.map(item => <div className='w-full'>
                <div key={item.file + item.name}><b>{item.name}</b> {item.file}</div>
                <Progress key={item.file} percent={parseFloat(item.progress?.toFixed(2))} /></div>)
            }

            <div className='font-semibold p-4 bg-gray-100 w-full rounded-md'>GPT 2</div>
            {
              gpt2Instance?.progress?.map(item => <div className='w-full'>
                <div key={item.file + item.name}><b>{item.name}</b> {item.file}</div>
                <Progress key={item.file} percent={parseFloat(item.progress?.toFixed(2))} /></div>)
            }


            {/* {
              progressItems.map(item => <div className='w-full'>
                <div key={item.file + item.name}><b>{item.name}</b> {item.file}</div>
                <Progress key={item.file} percent={parseFloat(item.progress.toFixed(2))} /></div>)
            } */}
          </div>
          <div className='md:w-1/2 w-full md:h-[calc(100vh-200px)] border border-gray-200 p-10 overflow-y-auto shadow-md rounded-md '>
            <Markdown>
              {`#### Hello Stranger.
This is a simple demo created to showcase browser only voicebot capabilities using client side inference.

**It only requires CPU and works on any browser.** This project has no server and everything is done client side.

The models used here are extremely tiny so please adjust your expectations and try to speak as clearly as possible.

**Example questions:**
- What is a CPU?
- What is a transformer?
- Who created Facebook?


**Following libraries and models where used to make this demo possible:**

- transformers.js
- whisper tiny
- hark (for speaker detection)
- LaMini-Flan-T5-783M
- Xenova/speecht5_tts
- antd
- tailwindcss
- react
- vite
- markdown-to-jsx

`}
            </Markdown>
            <img src='undraw.png' className='h-[150px] mx-auto' />
          </div>

        </div>
        {/* FOOTER */}
        <div className='p-6 bg-gray-100 mt-auto w-full text-center font-semibold'>
          by Igor B. (@misterkuka)
        </div>
      </div>
    </>
  )
}

export default App
