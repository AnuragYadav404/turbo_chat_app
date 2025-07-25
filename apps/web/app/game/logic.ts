import { Dispatch, SetStateAction } from "react";

interface Point {
    x: number,
    y: number
}

interface Stroke {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
}
type Line = Stroke[];
type Shapes = Line[];

type ShapeStore = Shapes;

export class GameLogicClass {
    private canvas:HTMLCanvasElement;
    private ctx:CanvasRenderingContext2D;

    private socket:WebSocket;
    private roomSlug:string;

    private currentTool:string="pen";

    private isDrawing:boolean=false;
    private isErasing:boolean=false;
    private startPoint:Point = {x:0,y:0};
    private intermediateStroke:Stroke[] = []
    //

    private shapeStore:ShapeStore = [];
    private setMessages:Dispatch<SetStateAction<Shapes>>;


    // here we probably don't need a shapeStore as the useEffect will run many times
    //

    constructor(canvas:HTMLCanvasElement, ctx: CanvasRenderingContext2D, currentTool:string, socket: WebSocket, roomSlug:string, messages: ShapeStore, setMessages:Dispatch<SetStateAction<Shapes>>) {
        this.canvas=canvas;
        this.ctx=ctx;

        this.socket=socket;
        this.roomSlug=roomSlug;

        this.currentTool=currentTool;

        this.setCanvasAttributes();
        this.attachEventListeners();

        // initialize the shapeStore
        this.shapeStore=messages;
        this.setMessages=setMessages;

        // this.loadStoredShapes();
        // here we need to fetch the stored messages already;

        // 1. refetch all the messages from the HTTP server on component mount
        // Problem: Too many network calls

        // 2. store it in localStorage
        //  What this means: keep a local copy of the messages of the current room in localStorage
        // But what if the user changes the room?
        // Problem: quite complex structure
        // will need to make additional flush calls to ws server
        this.socket.onmessage = this.handleNewSocketMessage
        // here we also need to call a draw function
        //this.drawShapeStore; works good
        this.draw_stored_shapes();    


    }
 

    private setCanvasAttributes = () => {
        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;
        this.ctx.strokeStyle = "red"
        this.ctx.lineWidth = 2;           // Set stroke thickness
        this.ctx.lineJoin = 'round';      // Smooth corners
        this.ctx.lineCap = 'round';  
    }

    private draw_stored_shapes = () => {
        this.shapeStore.map((line) => {
            line.map((str) => {
                this.ctx.beginPath();
                this.ctx.moveTo(str.startX, str.startY);
                this.ctx.lineTo(str.endX, str.endY);
                this.ctx.stroke();
            })
        })
    }
    

    // private draw_stored_shapes = () => {
    //     this.shapeStore.map((line) => {
    //         line.map((str) => {
    //             this.ctx.beginPath();
    //             this.ctx.moveTo(str.startX, str.startY);
    //             this.ctx.lineTo(str.endX, str.endY);
    //             this.ctx.stroke();
    //         })
    //     })
    // }

    private attachEventListeners = () => {
        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("mouseup", this.handleMouseUp);
        this.canvas.addEventListener("mouseleave", this.handleMouseUp);
    }

    private getMousePos = (evt:MouseEvent):Point => {
        return {
            x: evt.clientX,
            y: evt.clientY
        }
    }

    private isStrokeNearEraser = (x:number, y:number, stroke:Stroke, radius:number) => {
        const { startX, startY, endX, endY } = stroke;

        const dx = endX - startX;
        const dy = endY - startY;

        // Handle case where start and end are the same point (zero-length stroke)
        if (dx === 0 && dy === 0) {
            const dist = Math.hypot(x - startX, y - startY);
            return dist <= radius;
        }

        // Project point onto the line, then clamp to segment
        const t = ((x - startX) * dx + (y - startY) * dy) / (dx * dx + dy * dy);
        const clampedT = Math.max(0, Math.min(1, t));

        const closestX = startX + clampedT * dx;
        const closestY = startY + clampedT * dy;

        const distance = Math.hypot(x - closestX, y - closestY);
        return distance <= radius;
    }

    private checkLineNearToEraser = (line: Line, eraserPoint: Point):boolean => {
        // here we check for each stroke
        // how does a line look like: [stroke];
        for(let i=0;i<line.length;i++) {
            const stroke:Stroke = line[i];
            if(this.isStrokeNearEraser(eraserPoint.x, eraserPoint.y, stroke, 10)) {
                return true;
            }
        }
        return false;
    }

    private handleMouseDown = (e:MouseEvent) => {
        if(!this.ctx||!this.canvas) {
            return;
        }
        // here we need to write and update booleans based on current tool;
        if(this.currentTool=="Pen") {
            // User wants to draw
            this.isDrawing = true
            const mousePos = this.getMousePos(e);

            this.ctx.beginPath();
            // this becomes our start point for one of the lineStroke

            this.startPoint.x = mousePos.x;
            this.startPoint.y = mousePos.y;
            
            this.ctx.moveTo(mousePos.x, mousePos.y);
        }else if(this.currentTool == "Eraser") {
            // User wants to erase
            this.isErasing = true;
            const mousePos = this.getMousePos(e);

            // here we need to change the type of shapeStore
            for(let i = 0; i<this.shapeStore.length;i++) {
                // we need to fetch lines from
                const line = this.shapeStore[i];
                const lineIsNearToEraser:boolean = this.checkLineNearToEraser(line, mousePos);
                if(lineIsNearToEraser) {


                    this.shapeStore.splice(i,1);


                }
            }
            this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
            this.draw_stored_shapes();
        }
    }
    private handleMouseMove = (e:MouseEvent) => {
        if(!this.ctx||!this.canvas) return;
        if(this.isDrawing) {
            // handle logic for drawing
            const mousePos = this.getMousePos(e);   
            // this mousePos becomes our end for old startPoint and start for new startPoint
            // renderScreen(); **
            // ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.intermediateStroke.push({
                startX: this.startPoint.x,
                startY: this.startPoint.y,
                endX: mousePos.x,
                endY: mousePos.y,
                
            })
            this.ctx.lineTo(mousePos.x, mousePos.y);    // Draw a line to the new point
            this.ctx.stroke();   

            this.ctx.beginPath();
            
            this.startPoint.x = mousePos.x;
            this.startPoint.y = mousePos.y;
            this.ctx.moveTo(mousePos.x, mousePos.y);
        }else if(this.isErasing) {
            // handle logic for erasing
            const mousePos = this.getMousePos(e);

            for(let i = 0; i<this.shapeStore.length;i++) {

                const line = this.shapeStore[i];
                const lineIsNearToEraser:boolean = this.checkLineNearToEraser(line, mousePos);
                if(lineIsNearToEraser) {



                    this.shapeStore.splice(i,1);


                }
            }
            this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
            this.draw_stored_shapes();
        }

    }
    private handleMouseUp = (e:MouseEvent) => {
        if(!this.ctx) return;
        if(this.isDrawing) {
            // handle logic for drawing end
            this.isDrawing = false;
            const mousePos = this.getMousePos(e);   
            this.intermediateStroke.push({
                startX: this.startPoint.x,
                startY: this.startPoint.y,
                endX: mousePos.x,
                endY: mousePos.y,
                
            })
            this.ctx.lineTo(mousePos.x, mousePos.y);    // Draw a line to the new point
            // this.ctx.quadraticCurveTo(this.startPoint.x, this.startPoint.y, mousePos.x, mousePos.y);
            this.ctx.stroke();
            

            this.shapeStore.push(this.intermediateStroke);
            this.intermediateStroke = [];

            // here we will send messages to socket server, we do not set localstorage directly
            // localStorage.setItem("Shapes", JSON.stringify(this.shapeStore));
            this.syncShapeStore();
        }else if(this.isErasing) {
            // handle logic for erasing end
            // here we need to update localstorage as well
            // localStorage.setItem("Shapes", JSON.stringify(this.shapeStore));
            this.syncShapeStore()
            this.isErasing = false;
        }
    }

    private syncShapeStore = () => {
        // here we send message to websocket server
        // localStorage.setItem("Shapes", JSON.stringify(this.shapeStore));
        const JSONShapes = JSON.stringify(this.shapeStore);

        this.socket.send(JSON.stringify({
                type:"chat_message",
                roomSlug: this.roomSlug,
                message: JSONShapes
        }))
    }

    private handleNewSocketMessage = (e:MessageEvent) => {
        console.log("New message from websocket server")
        const data = JSON.parse(e.data);
        console.log("Getting new message", data)
        if(data.type === "chat") {

            // here the new shapeStore becomes: data.message
            const newShapeStore = JSON.parse(data.message);

            this.updateShapeStore(newShapeStore);
            // here we need to re-render the entire screen;
            // this.draw_stored_shapes();
            // this.renderScreen()
        }
    }

    private clearMouseHandlers = () => {
        this.canvas.removeEventListener("mousedown", this.handleMouseDown);
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        this.canvas.removeEventListener("mouseup", this.handleMouseUp);
        this.canvas.removeEventListener("mouseleave", this.handleMouseUp);
    }

    public updateShapeStore = (newState:Shapes) => {
        // here we do the big thing
        // this.setMessages((m) => [...m, ])
        this.setMessages(newState);   
    }

    private renderScreen = () => {
        this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height)
        this.draw_stored_shapes();
    }

    public destroy = () => {
        this.clearMouseHandlers();
        // this.socket?.send(JSON.stringify({
        //     type: "exit_room",
        //     roomSlug: this.roomSlug,
        // }))
    }
}


