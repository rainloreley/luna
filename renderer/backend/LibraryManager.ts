import {ICommonTagsResult} from "music-metadata";
import {v4 as uuidv4} from "uuid";
const appData = require("app-data-folder");
import fs from "fs";
const appDataFolder = appData("dev.abmgrt.luna");
import * as mm from 'music-metadata';
class LibraryManager {
    musicCatalogue: Song[]
    playlists: Playlist[]

    constructor(musicCatalogue: Song[], playlists: Playlist[]) {
        this.musicCatalogue = musicCatalogue;
        this.playlists = playlists

    }

    importMusic = async (paths: string[], updates: (currentname, currentcount, total) => void): Promise<LibraryManager> => {
        let _newSongs: Song[] = [];
        if (!fs.existsSync(appDataFolder)) {
            fs.mkdir(appDataFolder, _ => {});
        }
        if (!fs.existsSync(`${appDataFolder}/music`)) {
            fs.mkdirSync(`${appDataFolder}/music`);
        }
        for (var i = 0; i < paths.length; i++) {
            const path = paths[i];
            console.log(path);
            updates(path.split("/").pop(), i + 1, paths.length);
            var generateUUID = true;
            var songUUID = "";

            // loop to avoid duplicate uuids
            while (generateUUID) {
                songUUID = uuidv4();
                const matchExists = this.musicCatalogue.findIndex((e) => {return e.uid === songUUID})
                if (matchExists < 0) {
                    generateUUID = false;
                }
            }


            const songPath = `${appDataFolder}/music/${songUUID}_${path.split("/").pop()}`

            fs.copyFileSync(path, songPath)

            const metadata = await mm.parseFile(path, {duration: true});
            metadata.common.picture = undefined;
            const songName = metadata.common.title ?? path.split("/").pop().replace(".mp3", "").replace(".wav", "").replace(".ogg", "")

            _newSongs.push({
                uid: songUUID,
                path: songPath,
                name: songName,
                metadata: metadata.common,
                duration: metadata.format.duration,
                added: Date.now()
            })
        }
        this.musicCatalogue = this.musicCatalogue.concat(_newSongs);
        this.saveData();
        return this;
    }

    public static loadData = (): LibraryManager => {
        if (fs.existsSync(`${appDataFolder}/data.json`)) {
            const _dataFile = fs.readFileSync(`${appDataFolder}/data.json`, {encoding: "utf8"});
            const _dataJson = JSON.parse(_dataFile);
            /*const samplePlaylist: Playlist = {
                uid: "03952",
                name: "Cool",
                color: "#ff0000",
                entries: [
                    {
                        uid: "2322332",
                        customName: "DNA Song",
                        song: "08bb7093-c76d-4de8-8f86-a9eb145c2125",
                        index: 0,
                        endBehavior: PlaylistEntryEndBehavior.next
                    },
                    {
                        uid: "94209ßß9249ß09240ß4ß02",
                        customName: "Mission Impossible",
                        song: "9fd85ed8-0136-4c03-be36-d1793c83a70a",
                        index: 1,
                        endBehavior: PlaylistEntryEndBehavior.stop
                    }
                ]
            }*/
            return new LibraryManager(_dataJson.musicCatalogue, _dataJson.playlists)
        }
        else {
            return new LibraryManager([], []);
        }
    }

    saveData = () => {
        if (!fs.existsSync(appDataFolder)) {
            fs.mkdir(appDataFolder, _ => {});
        }

        // May be used later
        /*const _musicCatalogue = JSON.stringify(this.musicCatalogue);
        const _playlists = JSON.stringify(this.playlists);*/
        const _data = {
            musicCatalogue: this.musicCatalogue,
            playlists: this.playlists
        }
        fs.writeFileSync(`${appDataFolder}/data.json`, JSON.stringify(_data), {encoding: "utf8"});
    }
}

interface Song {
    uid: string
    path: string
    name: string
    metadata: ICommonTagsResult
    duration: number
    added: number
}

interface Playlist {
    uid: string
    name: string
    color: string
    entries: PlaylistEntry[]
}

interface PlaylistEntry {
    uid: string
    customName: string
    song: string
    index: number
    endBehavior: PlaylistEntryEndBehavior
}

enum PlaylistEntryEndBehavior {
    next,
    stop

}
export {PlaylistEntryEndBehavior};
export type {Song, PlaylistEntry, Playlist};
export default LibraryManager;