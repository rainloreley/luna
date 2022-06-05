const secondsToMMSSFormat = (seconds: number) => {
    const floored = Math.floor(seconds)
    return String(Math.floor((floored / 60))).padStart(2, "0") + ":" + String(floored - (Math.floor(floored / 60) * 60)).padStart(2, "0")
}

export {secondsToMMSSFormat}