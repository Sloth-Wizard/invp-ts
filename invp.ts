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
    offset: Intersection,
    threshold: number
}

/**
 * Observe if element is in viewport
 * Inpired by in-view.js
 */
export class InVp {
    is_visible_class: string = 'is-visible';
    debounce_time: number = 200;
    options: Options = {
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
     * @param query
     * 
     * @returns NodeListOf<HTMLElement>
     */
    get_elements(query: string): NodeListOf<HTMLElement> {
        return document.querySelectorAll(query);
    }

    /**
     * Observe the elements comming in the viewport
     * 
     * @param elements
     */
    observe(elements: NodeListOf<HTMLElement>): void {
        // Copy the NodeList after registering all already visible elements into an array so we can slice it later
        let nodes: Array<HTMLElement> = this.register([].slice.call(elements, 0));

        // Events to subscribe
        const SCROLLING: Observable<Event>  = fromEvent(document, 'wheel').pipe(debounce(() => interval(this.debounce_time)));
        const RESIZE: Observable<Event>     = fromEvent(window, 'resize').pipe(debounce(() => interval(this.debounce_time)));
        
        // Merge all those events
        const EVENTS: Observable<Event> = merge(
            SCROLLING,
            RESIZE
        );

        // Subscribe to all events
        const SUBSCRIPTION: Subscription = EVENTS.subscribe(() => {
            this.register(nodes, SUBSCRIPTION);
        });
    }

    /**
     * Register the elements in viewport
     * 
     * @param nodes 
     * @param subscription
     * 
     * @returns Array<HTMLElement>
     */
    register(nodes: Array<HTMLElement>, subscription?: Subscription): Array<HTMLElement> {
        nodes.forEach((el, i) => {
            if (this.in_viewport(el, {offset: this.options.offset, threshold: this.options.threshold})) {
                el.classList.add(this.is_visible_class);

                // Slice the index node because it has been loaded
                nodes.splice(i, 1);

                // When the nodes are empty, it means everything has been loaded so stop the subscription
                if (subscription && nodes.length === 0) subscription.unsubscribe();
            }
        });

        return nodes;
    }

    /**
     * Check whether an element is in the viewport or not
     * 
     * @param el 
     * @param options
     * 
     * @returns boolean
     */
    in_viewport(el: HTMLElement, options: {offset: Intersection, threshold: number}): boolean {
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

        return INTERSECTION.top     > (options.offset.top       + THRESHOLD.y)
            && INTERSECTION.right   > (options.offset.right     + THRESHOLD.x)
            && INTERSECTION.bottom  > (options.offset.bottom    + THRESHOLD.y)
            && INTERSECTION.left    > (options.offset.left      + THRESHOLD.x)
    }
}
