import jwt, { SignOptions } from 'jsonwebtoken'

export class JwtService {
    static sign<T extends object>(
        payload: T,
        expiresIn: SignOptions['expiresIn'] = '1d'
    ): string {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET as jwt.Secret,
            { expiresIn }
        )
    }

    static verify<T extends object>(token: string): T {
        return jwt.verify(
            token,
            process.env.JWT_SECRET as jwt.Secret
        ) as T
    }
}
