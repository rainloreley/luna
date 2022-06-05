import {ipcRenderer} from "electron";
import LibraryManager, {Song} from "../backend/LibraryManager";
import {createContext, useEffect, useState} from "react";
import {Download, Pause, Play, SkipBack, SkipForward, Speaker} from "react-feather";
import {Slider} from "@mui/material";
import {secondsToMMSSFormat} from "../helpers/HelperFunctions";

type AppControlHandlerProps = {
    libraryManager: LibraryManager
    playSong: (song: Song) => void;
}

export const AppControlContext = createContext<AppControlHandlerProps>(null);

const AppControlProvider = ({children}) => {

    const [libraryManager, setLibraryManager] = useState<LibraryManager | null>(null);

    const [currentlyPlaying, setCurrentlyPlaying] = useState<PlayingSong | null>(null);
    const [currentlyPlayingProgress, setCurrentlyPlayingProgress] = useState<number>(0);
    const [currentlyPlayingPaused, setCurrentlyPlayingPaused] = useState(true);

    var updatingTime = false;

    useEffect(() => {
        if (libraryManager == null) {
            const _loadedLibraryManager = LibraryManager.loadData();
            setLibraryManager(_loadedLibraryManager);
        }
    }, []);

    useEffect(() => {
        ipcRenderer.removeAllListeners("app::import-music-paths-ready");
        ipcRenderer.on("app::import-music-paths-ready", (event, args) => {
            libraryManager.importMusic(args).then((res) => {
                setLibraryManager(res);
                ipcRenderer.send("app::reload-catalogue-to-main", JSON.stringify(res.musicCatalogue));
            })
        })
    }, [libraryManager]);

    useEffect(() => {
        if (currentlyPlaying != null && !updatingTime) {
            currentlyPlaying.audio.ontimeupdate = (_) => {
                updatingTime = true
                setCurrentlyPlayingProgress(parseInt(currentlyPlaying.audio.currentTime.toFixed(0)))
            }
            currentlyPlaying.audio.onplaying = (_) => {
                setCurrentlyPlayingPaused(false);
            }
            currentlyPlaying.audio.onpause = (_) => {
                setCurrentlyPlayingPaused(true);
            }
        }
        else {
            updatingTime = false;
        }
    }, [currentlyPlaying]);

    const playSong = async (song: Song) => {
        if (currentlyPlaying != null) {
            currentlyPlaying.audio.pause();
        }
        const _audioElement = new Audio(`file://${song.path}`);
        const _playingSong = new PlayingSong(song, _audioElement);
        _playingSong.audio.play().then((_) => {
            setCurrentlyPlayingPaused(false);
            setCurrentlyPlaying(_playingSong);
        });
    }

    const state: AppControlHandlerProps = {
        libraryManager: libraryManager,
        playSong: playSong
    }
    return (
     <div className={"h-full m-0 dark:bg-dark-primary dark:text-white overflow-hidden"}>
         {libraryManager != null ? (
             <AppControlContext.Provider value={state}>
                 <div className={"flex flex-col h-screen m-0"}>
                     <div className={"bg-gray-100 dark:bg-dark-secondary p-3 h-14 flex items-center justify-between"}>
                         <div className={"flex"}>
                             <Speaker className={"mr-2"} width={20} />
                             <h1 className={"text-xl font-bold bg-gradient-to-tr from-red-400 to-purple-400 text-transparent bg-clip-text"}>Luna</h1>
                         </div>
                         <div className={"flex items-center"}>
                             <button onClick={async () => {
                                 await ipcRenderer.send("app::import-music");
                             }}>
                                 <Download />
                             </button>
                         </div>
                     </div>
                     {children}
                     <div className={"flex p-4 h-28 flex-col items-center bg-gray-100 dark:bg-dark-secondary fixed bottom-0 left-0 right-0"}>
                         <div className={"w-1/2 flex flex-col items-center"}>
                             <div>
                                 <div className={"flex justify-center"}>
                                     <button>
                                         <SkipBack />
                                     </button>
                                     <button onClick={async () => {
                                         if (currentlyPlaying != null) {
                                             if (currentlyPlayingPaused) {
                                                 await currentlyPlaying.audio.play()
                                             }
                                             else {
                                                 await currentlyPlaying.audio.pause()
                                             }
                                         }
                                     }}>
                                         {!currentlyPlayingPaused ? (
                                             <Pause />
                                         ) : (
                                             <Play />
                                         )}

                                     </button>
                                     <button>
                                         <SkipForward />
                                     </button>
                                 </div>
                                 {currentlyPlaying != null ? (
                                     <h1 className={"text-lg font-bold"}>{currentlyPlaying.song.name}</h1>
                                 ) : (
                                     <h1 className={"italic text-gray-600 dark:text-gray-500"}>Kein Lied ausgewählt</h1>
                                 )}
                             </div>
                             <div className={"flex w-full items-center"}>
                                 <p className={"text-gray-500 text-sm mr-3"}>{secondsToMMSSFormat(currentlyPlayingProgress)}</p>
                                 <Slider size="small" min={0} max={currentlyPlaying != null ? currentlyPlaying.audio.duration : 1} disabled={currentlyPlaying == null} value={currentlyPlayingProgress} onChange={(e) => {
                                     setCurrentlyPlaying((song) => {
                                         // @ts-ignore
                                         song.audio.currentTime = parseInt(e.target.value)
                                         return song;
                                     })
                                 }} sx={{
                                     color: "#3B82F6",
                                 }} />
                                 {currentlyPlaying != null ? (
                                     <p className={"text-gray-500 text-sm ml-3"}>{secondsToMMSSFormat(Math.floor(currentlyPlaying.audio.duration))}</p>
                                 ) : (
                                     <p></p>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             </AppControlContext.Provider>
         ) : (
             <div className={"bg-dark-primary flex h-full w-full justify-center items-center"}>
                 <div className={"flex flex-col items-center"}>
                     <img src={"/svg/loading.svg"} className={"mb-2"} />
                     <h1 className={"text-white"}>Loading...</h1>
                 </div>
             </div>
         )}
     </div>
    )
}

class PlayingSong {
    song: Song
    audio: HTMLAudioElement
    progress: number

    constructor(song: Song, audio: HTMLAudioElement) {
        this.song = song;
        this.audio = audio;
    }
}

export default AppControlProvider