import React, {useContext, useState} from 'react';
import SidebarComponent from "../components/sidebar/sidebar_component";
import MusicLibraryView from "./views/musicLibraryView";
import Sidebar_ViewWrapper from "../components/sidebar/sidebar_viewWrapper";
import {AppControlContext} from "../components/appContextProvider";
import PlaylistView from "./views/playlistView";

function Home() {

    const [selectedItem, setSelectedItem] = useState<string>("library");
    const {libraryManager, addSongsToPlaylist} = useContext(AppControlContext);

    const [librarySelectedSongs, setLibrarySelectedSongs] = useState<string[]>([]);

  return (
      <div className={"flex centerView"}>
          <SidebarComponent selectItem={(uid) => {
              if (selectedItem != uid) {
                  setLibrarySelectedSongs([]);
              }
              setSelectedItem(uid);
          }} rightClickItem={(uid) => {
              addSongsToPlaylist(uid, librarySelectedSongs);
          }}/>
          {selectedItem == "library" ? (
              <Sidebar_ViewWrapper title={"Bibliothek"} note={librarySelectedSongs.length > 0 ? `Rechts-klicke auf eine Playlist, um ${librarySelectedSongs.length === 1 ? "das" : "die"} Lied${librarySelectedSongs.length > 1 ? "er" : ""} hinzuzufügen` : ""}>
                  <MusicLibraryView setSelectedSongs={(songs) => {
                      setLibrarySelectedSongs(songs);
                  }}/>
              </Sidebar_ViewWrapper>
          ) : (
              <Sidebar_ViewWrapper title={libraryManager.playlists.find((e) => e.uid == selectedItem).name} note={""}>
                  <PlaylistView playlistUID={selectedItem} key={selectedItem} />
              </Sidebar_ViewWrapper>
          )}
      </div>
  );
}

export default Home;
