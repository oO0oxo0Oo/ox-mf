

export function useScramble(length = 15) {
    const queue = [];
    const sequence = ['U', 'U\'', 'D', 'D\'', 'L', 'L\'', 'R', 'R\'', 'F', 'F\'', 'B', 'B\'']
    let last;
    while(queue.length < length) {
        let t = sequence[Math.floor(Math.random() * sequence.length)];
        if(last && t[0] === last[0]) {
            continue;
        }
        queue.push(t);
        last = t;
    }
    return queue;
}
