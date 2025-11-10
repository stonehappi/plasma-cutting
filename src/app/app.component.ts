import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {filter, map, Observable} from "rxjs";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {AddUp, Steel} from "./app.model";

const DENSITY = 7850;
const REQUIRED = [Validators.required, Validators.min(1)];
type INPUT_TYPE = 'thickness' | 'width' | 'length' | 'hole' | 'steel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  total: number = 0;
  addUps$: Observable<AddUp[]>;
  hole: number = 0;
  form: FormGroup = new FormGroup({
    width: new FormControl<number | null>(null, REQUIRED),
    length: new FormControl<number | null>(null, REQUIRED),
    thickness: new FormControl<number | null>(null,
      [
        Validators.required,
        Validators.min(3),
        Validators.max(30)
      ]
    ),
    steel: new FormControl<number>(null, Validators.min(0.001)),
    hole: new FormControl<number>(0, Validators.min(0)),
  });
  thicknessMin: number = 3;
  thicknessMax: number = 30;

  constructor(db: AngularFirestore) {
    this.addUps$ = db.collection<AddUp>('addUps', ref => ref.orderBy('value')).valueChanges();
    db.collection<Steel>('PricePerHole', ref => ref.orderBy('date', 'desc')).valueChanges()
      .pipe(map(m => m[0].price)).subscribe(value => this.hole = value);
    db.doc('Setting/Thickness').valueChanges().subscribe((value: any) => {
      this.thicknessMin = value['Min'];
      this.thicknessMax = value['Max'];
      this.form.get('thickness')?.setValidators([
        Validators.required,
        Validators.min(value['Min']),
        Validators.max(value['Max'])
      ]);
    });
    this.form.valueChanges
      .pipe(filter(_ => this.form.valid))
      .subscribe((result) => {
        this.onCalculate(result.width!, result.length!, result.thickness!, result.hole!, result.steel!);
      });
  }

  isError(type: INPUT_TYPE): boolean {
    return this.form.get(type)!.invalid;
  }

  onCalculate(width: number, length: number, thickness: number, hole: number, steel: number): void {
    const volume = ((width + 5) * thickness * (length + 5)) / 1000000000;
    const costOfMaterial = volume * DENSITY * steel;
    this.total = costOfMaterial + (hole * this.hole);
  }
}
