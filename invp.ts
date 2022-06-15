import { fromEvent, interval, merge, Observable, Subscription } from 'rxjs';
import { debounce } from 'rxjs/operators';

interface ViewportPosition extends Intersection {
    width: number;
    height: number;
}

interface Intersection {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface Threshold {
    x: number;
    y: number;
}

interface Options {
    offset: Intersection;
    threshold: number;
}

interface Reaveal {
    element: HTMLElement;
    reveal: boolean;
}

/**
 * Observe if element is in viewport
 * Inpired by in-view.js
 */
export class InVp {
    protected visible_elements: number = 0;
    protected is_visible_class: string = 'is-visible';
    protected debounce_time: number = 200;
    protected options: Options = {
        offset: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        },
        threshold: 0
    };

    constructor(query: string, options?: Options) {
        if (typeof options !== 'undefined') this.options = options;
        this.observe(this.get_elements(query+':not(.'+this.is_visible_class+')'));
    }

    /**
     * Get the elements we need to link to an observable
     * 
     * @param query - string
     * 
     * @returns `NodeListOf<T>`
     */
    private get_elements<T extends HTMLElement>(query: string): NodeListOf<T> {
        return document.querySelectorAll(query);
    }

    /**
     * Observe the elements comming in the viewport
     * 
     * @param elements
     * 
     * @returns `Promise<void>`
     */
    private async observe(elements: NodeListOf<HTMLElement>): Promise<void> {
        // Copy the NodeList after registering all already visible elements into an array so we can slice it later
        return await this.register([].slice.call(elements, 0)).then(async els => {
            if (!els) return; // End silently because we just received the unsub signal
            // Events to subscribe
            const SCROLLING: Observable<Event>  = fromEvent(document, 'wheel').pipe(debounce(() => interval(this.debounce_time)));
            const RESIZE: Observable<Event>     = fromEvent(window, 'resize').pipe(debounce(() => interval(this.debounce_time)));

            // Merge all those events
            const EVENTS: Observable<Event> = merge(
                SCROLLING,
                RESIZE
            );

            // Subscribe to all events
            const SUBSCRIPTION: Subscription = EVENTS.subscribe(async () => {
                await this.register(els, SUBSCRIPTION);
            });
        });
    }

    /**
     * Register the elements in viewport
     * 
     * @param nodes - HTMLElement[]
     * @param subscription - Subscription
     * 
     * @returns `Promise<HTMLElement[] | void>`
     */
    private async register(nodes: HTMLElement[], subscription?: Subscription): Promise<HTMLElement[] | void> {
        if (subscription && this.visible_elements === nodes.length)
            return subscription.unsubscribe();
        
        for (const NODE of nodes) {
            await this.in_viewport(NODE, this.options).then(async r => {
                if (r.reveal)
                    await this.addclass(r.element).then(b => {
                        if (b)
                            this.visible_elements = this.visible_elements+1;
                    });
                    
            });
        }

        return nodes;
    }

    /**
     * ## Check whether an element is in the viewport or not
     * 
     * @param el - HTMLElement
     * @param options - Options
     * 
     * @returns `Promise<Reaveal>`
     */
    private async in_viewport(el: HTMLElement, options: Options): Promise<Reaveal> {
        const BCR: ViewportPosition = el.getBoundingClientRect();
        const INTERSECTION: Intersection = {
            top: BCR.bottom,
            right: window.innerWidth - BCR.left,
            bottom: window.innerHeight - BCR.top,
            left: BCR.right
        };

        const THRESHOLD: Threshold = {
            x: options.threshold * BCR.width,
            y: options.threshold * BCR.height
        }

        return {
            element: el,
            reveal: INTERSECTION.top     > (options.offset.top       + THRESHOLD.y)
            && INTERSECTION.right   > (options.offset.right     + THRESHOLD.x)
            && INTERSECTION.bottom  > (options.offset.bottom    + THRESHOLD.y)
            && INTERSECTION.left    > (options.offset.left      + THRESHOLD.x)
        }
    }

    /**
     * ## Add a class to the element and checks if it was added
     * 
     * @param el - HTMLElement
     * 
     * @returns `Promise<boolean>`
     */
    private async addclass(el: HTMLElement): Promise<boolean> {
        // Class already there when going throught again so send a false signal
        if (el.classList.contains(this.is_visible_class))
            return false;

        el.classList.add(this.is_visible_class);
        return el.classList.contains(this.is_visible_class);
    }
}
