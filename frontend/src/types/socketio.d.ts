declare module 'socket.io-client' {
  export interface Socket {
    emit: (event:string, ...args:any[])=>void;
    on: (event:string, cb:(...args:any[])=>void)=>void;
    off?: (event:string, cb:(...args:any[])=>void)=>void;
  }
  export function io(url: string, opts?: any): Socket;
}
