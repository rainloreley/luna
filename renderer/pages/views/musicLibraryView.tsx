import {NextPage} from "next";
import {FunctionComponent, useContext, useEffect, useState} from "react";
import {AppControlContext} from "../../components/appContextProvider";
import {Song} from "../../backend/LibraryManager";
import {Play, PlayCircle} from "react-feather";
import {ipcRenderer} from "electron";
import {secondsToMMSSFormat} from "../../helpers/HelperFunctions";
import AnimatedEQ from "../../components/icons/AnimatedEQ";

const MusicLibraryView: NextPage = () => {

    const {libraryManager} = useContext(AppControlContext);
    const [musicCatalogue, setMusicCatalogue] = useState<Song[]>([]);

    useEffect(() => {
        loadMusicCatalogue(libraryManager.musicCatalogue);
        ipcRenderer.removeAllListeners("app::reload-catalogue");
        ipcRenderer.on("app::reload-catalogue", (event, args) => {
            loadMusicCatalogue(JSON.parse(args))
        });
    }, [libraryManager]);

    const loadMusicCatalogue = (catalogue: Song[]) => {
        setMusicCatalogue(catalogue);
    }

    return (
        <div className={"h-full"}>
            <ul className={"overflow-y-scroll h-full hideScrollbar"}>
                {musicCatalogue.map((song, index) => (
                    <SongCell song={song} key={song.uid} index={index} />
                ))}
            </ul>
        </div>
    )
}

interface SongCell_Props {
    song: Song
    index: number
}

const SongCell: FunctionComponent<SongCell_Props> = ({song, index}) => {

    const {playSong, currentlyPlaying} = useContext(AppControlContext);

    return (
        <li className={"flex m-2 p-2 rounded-lg items-center border-b dark:border-gray-500"}>
            <div className={"w-8"}>
                {currentlyPlaying !== null && currentlyPlaying.song.uid === song.uid && currentlyPlaying.playlist === "library" ? (
                    <AnimatedEQ />
                ) : (
                    <p className={"text-gray-500 mr-2 text-center text-lg"}>{index + 1}</p>
                )}
            </div>
            <button className={"bg-blue-500 rounded-lg w-9 h-9 flex justify-center items-center"} onClick={() => {
                playSong(song, "library", "");
            }}>
                <Play color={"white"} className={"w-7 h-7"} />
            </button>
            <div className={"flex-col ml-2"}>
                <h1 className={"text-lg font-bold"}>{song.name}</h1>
                <p className={"text-sm text-gray-400"}>{secondsToMMSSFormat(song.duration)} • {typeof song.metadata.artist === "string" ? song.metadata.artist : "Unknown Artist"}</p>
            </div>
        </li>
    )
}

export default MusicLibraryView;