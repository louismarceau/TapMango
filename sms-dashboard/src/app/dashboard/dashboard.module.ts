import { NgModule } from "@angular/core";
import { DashboardComponent } from "./components/dashboard.component";
import { CommonModule } from "@angular/common";

@NgModule({
    declarations: [
        DashboardComponent
    ],
    imports: [
        CommonModule
    ],
    exports: [
        DashboardComponent
    ]
})
export class DashboardModule { }