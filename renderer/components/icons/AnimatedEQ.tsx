import styles from "../../styles/AnimatedEQ.module.css"

/*
Credit: https://codepen.io/ViRPo/pen/YzKWWPW
Slightly modified
*/
const AnimatedEQ = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect className={`${styles.eqbar} ${styles.eqbar1}`} x="4" y="4" width="3.7" height="8"/>
            <rect className={`${styles.eqbar} ${styles.eqbar2}`} x="10.2" y="4" width="3.7" height="16"/>
            <rect className={`${styles.eqbar} ${styles.eqbar3}`} x="16.3" y="4" width="3.7" height="11"/>
        </svg>

    )
}
export default AnimatedEQ