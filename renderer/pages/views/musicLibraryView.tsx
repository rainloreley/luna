import {NextPage} from "next";
import {FunctionComponent, useContext, useEffect, useState} from "react";
import {AppControlContext} from "../../components/appContextProvider";
import {Song} from "../../backend/LibraryManager";
import {Play} from "react-feather";
import {ipcRenderer} from "electron";
import {secondsToMMSSFormat} from "../../helpers/HelperFunctions";
import AnimatedEQ from "../../components/icons/AnimatedEQ";

interface MusicLibraryView_Props {
    setSelectedSongs: (songs: string[]) => void;
}

const MusicLibraryView: NextPage<MusicLibraryView_Props> = ({setSelectedSongs}) => {

    const {libraryManager} = useContext(AppControlContext);
    const [musicCatalogue, setMusicCatalogue] = useState<Song[]>([]);
    const [selectedElements, setSelectedElements] = useState<string[]>([]);

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

    const selectedElement = (uid: string, single: boolean) => {
        let _selected = selectedElements;
         if (single) {
            if (_selected.includes(uid)) {
                _selected = [];
            }
            else {
                _selected = [uid];
            }
        }
        else {
             if (_selected.includes(uid)) {
                 _selected.splice(_selected.indexOf(uid), 1);
             }
             else {
                 _selected.push(uid);
             }
        }
        setSelectedSongs(_selected)
        setSelectedElements(_selected)
    }

    return (
        <div className={"h-full"}>
            <ul className={"overflow-y-scroll h-full hideScrollbar"}>
                {musicCatalogue.map((song, index) => (
                    <SongCell song={song} key={song.uid} index={index} selectedElement={selectedElement} isSelected={selectedElements.includes(song.uid)} />
                ))}
            </ul>
        </div>
    )
}

interface SongCell_Props {
    song: Song
    index: number
    selectedElement: (uid: string, single: boolean) => void;
    isSelected: boolean
}

const SongCell: FunctionComponent<SongCell_Props> = ({song, index, selectedElement, isSelected}) => {

    const {playSong, currentlyPlaying} = useContext(AppControlContext);
    const [selected, setSelected] = useState<boolean>(isSelected);

    useEffect(() => {
        setSelected(isSelected)
    }, [isSelected]);

    return (
        <li className={`flex m-2 p-2 rounded-lg items-center border-b dark:border-gray-500 ${selected ? "dark:bg-dark-secondary" : ""}`} onClick={(e) => {
            setSelected(!selected)
            selectedElement(song.uid, !e.metaKey);

        }}>
            <div className={"w-8"}>
                {currentlyPlaying !== null && currentlyPlaying.song.uid === song.uid && currentlyPlaying.playlist === "library" ? (
                    <AnimatedEQ isAnimating={!currentlyPlaying.audio.paused} />
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