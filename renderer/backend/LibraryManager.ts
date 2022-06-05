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

    importMusic = async (paths: string[]): Promise<LibraryManager> => {
        let _newSongs: Song[] = [];
        if (!fs.existsSync(`${appDataFolder}/music`)) {
            fs.mkdirSync(`${appDataFolder}/music`);
        }
        for (const path of paths) {
            fs.copyFileSync(path, `${appDataFolder}/music/${path.split("/").pop()}`)
            const metadata = await mm.parseFile(path, {duration: true});
            _newSongs.push({
                uid: uuidv4(),
                path: `${appDataFolder}/music/${path.split("/").pop()}`,
                name: metadata.common.title ?? path.split("/").pop().replace(".mp3", "").replace(".wav", "").replace(".ogg", ""),
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
    song: string
    index: number
    endBehavior: PlaylistEntryEndBehavior
}

enum PlaylistEntryEndBehavior {
    next,
    stop

}

export type {Song};
export default LibraryManager;