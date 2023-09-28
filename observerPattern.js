class ObserverGuard {
    constructor(observer) {
        this.observer = observer;
        this.unsubscribed = false;
    }

    next(data) {
        if(this.unsubscribed || !this.observer.next) {
            return;
        }

        try {
            this.observer(data);
        } catch(err) {
            this.unsubscribe();
            throw err;
        }
    }

    error(err) {
        if(this.unsubscribed || !this.observer.error) {
            this.unsubscribe();
            return;
        }

        try {
            this.observer.error(err);
        } catch(innerError) {
            this.unsubscribe();
            throw innerError;
        }

        this.unsubscribe();
    }

    complete() {
        if(this.unsubscribed || !this.observer.complete) {
            this.unsubscribe();
            return;
        }

        try {
            this.observer.complete();
        } catch(err) {
            this.unsubscribe();
            throw err;
        }

        this.unsubscribe();
    }

    unsubscribe() {
        this.unsubscribed = true;
        if (this.closeFn) {
            this.closeFn();
        }
    }

    closed() {
        return this.unsubscribed
    }
}

class Observable {
  constructor(blueprint) {
    this.observable = blueprint;
  }

  subscribe(observer) {
    const observerWithGuard = new ObserverGuard(observer);

    const closeFn = this.observable(observer);
    observerWithGuard.closeFn = closeFn;

    const subscription =  this.subscriptionMetaData(observerWithGuard);
    return subscription;
  }

  subscriptionMetaData(observerWithGuard) {
    return {
        unsubscribe() {
            observerWithGuard.unsubscribe();
        },
        get closed() {
            return observerWithGuard.closed();
        }
    }
  }
}

const obs = new Observable((observer) => {
  // producer
  let counter = 1;
  const producer = setInterval(() => {
      observer.next(counter++);

      if (counter > 5) {
        // observer.error('Error')
        observer.complete();
      }
  }, 1000);

  // unsubscription / teardown / close
  return () => {
    clearInterval(producer);
  };
});

const subscription = obs.subscribe({
  next: (data) => {
    console.log("obs1 ", data);
  },
  error: (err) => {
    console.log("obs1 error ", err);
  },
  complete: () => {
    console.log("obs1 completed!");
  },
});

console.log(subscription.closed);

// setTimeout(() => {
//     subscription.unsubscribe();
//     console.log(subscription.closed);
// }, 5000);

// ##########################################################################

// function observable(observer) {
//     // producer
//     // let counter = 1;
//     // const producer = setInterval(() => {
//     //     observer.next(counter++);
//     // }, 1000);

//     observer.next('hello');
//     observer.next('world');
//     observer.complete('done');
//     observer.next('I am still here!');
//     // unsubscription / teardown / close
//     return () => {
//         clearInterval(producer);
//     };
// }

// let closeFn1 = observable({
//     next: (data) => { console.log('obs1 ', data); },
//     error: (err) => { console.log('obs1 error ', err); },
//     complete: () => { console.log('obs1 completed!'); },
// });

// setTimeout(() => {
//     closeFn1();
// }, 5000);

// let closeFn2 = observable({
//     next: (data) => { console.log('obs2 ', data); },
//     error: (err) => { console.log('obs2 error ', err); },
//     complete: () => { console.log('obs2 completed!'); },
// });

// setTimeout(() => {
//     closeFn2();
// }, 5000);
