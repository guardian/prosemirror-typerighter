export const getClientRectIndex = (event: Event): number | undefined => {

    if (!event.target || !(event.target instanceof HTMLElement) || !(event instanceof MouseEvent)) {
        return undefined;
    }

    const rects = event.target.getClientRects();

    if(rects.length < 1) {
        return 0;
    }

    for (var i = 0; i != rects.length; i++) {
        const {left, right, top, bottom} = rects[i];
        const {pageX, pageY} = event;

        if(pageX >= left && pageX <= right && pageY >= top && pageY <= bottom){
            return i;
        }
    }

    return 0;
}