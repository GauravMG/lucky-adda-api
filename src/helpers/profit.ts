export function winningAmount(betAmount: number) {
	return betAmount * 90
}

export function betResult(arrNum: number[]) {
	const randomIndex = Math.floor(Math.random() * arrNum.length)
	return arrNum[randomIndex]
}
