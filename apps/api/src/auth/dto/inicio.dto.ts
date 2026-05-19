//----- Registro con datos de usuarios que se va a recibir desde el front

//-Tienen "!" los campos porque Typescript pide q los inicialice, pero es innecesario si siempre recibimos datos.
// entonces el signo indica que la clase con estos datos no se va a querer instanciar
//-Tiene "?" el campo que es opcional que se llene
export class InicioDto {
  email!: string;
  passwd!: string;
}